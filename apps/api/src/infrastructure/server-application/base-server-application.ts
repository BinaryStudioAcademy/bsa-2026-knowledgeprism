import { type S3Client } from "@aws-sdk/client-s3";
import { fastifyCookie } from "@fastify/cookie";
import fastifySession from "@fastify/session";
import fastifyStatic from "@fastify/static";
import swagger, { type StaticDocumentSpec } from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import Fastify, { type FastifyError, type FastifyInstance } from "fastify";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Config } from "~/infrastructure/config/libs/types/config.type.js";
import { type Database } from "~/infrastructure/database/database.js";
import { DatabaseStore } from "~/infrastructure/database/libs/packages/session/database-store.js";
import { type Health, HealthStatus } from "~/infrastructure/health/health.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { ServerErrorType } from "~/shared/enums/enums.js";
import { type ValidationError } from "~/shared/exceptions/exceptions.js";
import {
	type ServerCommonErrorResponse,
	type ServerValidationErrorResponse,
	type ValidationSchema,
} from "~/shared/types/types.js";

import { API_PATH_PREFIX } from "./libs/constants/api-path-prefix.constant.js";
import { SERVER_BODY_LIMIT_IN_BYTES } from "./libs/constants/server-body-limit.constant.js";
import { SESSION_COOKIE_NAME } from "./libs/constants/session-cookie-name.constant.js";
import {
	type ServerApplication,
	type ServerApplicationApi,
	type ServerApplicationRouteParameters,
} from "./libs/types/types.js";

type Constructor = {
	apis: ServerApplicationApi[];
	config: Config;
	database: Database;
	health: Health;
	logger: Logger;
	s3Client: S3Client;
	title: string;
};

declare module "fastify" {
	interface FastifyInstance {
		s3: S3Client;
	}
}

const API_ROUTE_NOT_FOUND_MESSAGE = "API route not found.";

const isApiPath = (url: string): boolean =>
	url === API_PATH_PREFIX || url.startsWith(`${API_PATH_PREFIX}/`);

const isClientErrorStatus = (statusCode: unknown): statusCode is number =>
	typeof statusCode === "number" &&
	statusCode >= HTTPCode.BAD_REQUEST &&
	statusCode < HTTPCode.INTERNAL_SERVER_ERROR;

class BaseServerApplication implements ServerApplication {
	private apis: ServerApplicationApi[];

	private app!: FastifyInstance;

	private config: Config;

	private database: Database;

	private health: Health;

	private logger: Logger;

	private s3Client: S3Client;

	private title: string;

	public constructor({
		apis,
		config,
		database,
		health,
		logger,
		s3Client,
		title,
	}: Constructor) {
		this.title = title;
		this.config = config;
		this.logger = logger;
		this.database = database;
		this.s3Client = s3Client;
		this.apis = apis;
		this.health = health;

		this.initApp();
	}

	public get fastify(): FastifyInstance {
		return this.app;
	}

	private initApp(): void {
		this.app = Fastify({
			bodyLimit: SERVER_BODY_LIMIT_IN_BYTES,
			ignoreTrailingSlash: true,
		});

		this.app.decorate("s3", this.s3Client);

		this.initErrorHandler();
	}

	private initErrorHandler(): void {
		this.app.setErrorHandler(
			(error: FastifyError | ValidationError, _request, reply) => {
				if ("issues" in error) {
					this.logger.error(`[Validation Error]: ${error.message}`);

					error.issues.forEach((issue) => {
						this.logger.error(`[${issue.path.toString()}] — ${issue.message}`);
					});

					const [firstIssue] = error.issues;
					const response: ServerValidationErrorResponse = {
						details: error.issues.map((issue) => ({
							message: issue.message,
							path: issue.path.map((segment) => segment.toString()),
						})),
						errorType: ServerErrorType.VALIDATION,
						message: firstIssue?.message ?? error.message,
					};

					return reply.status(HTTPCode.UNPROCESSED_ENTITY).send(response);
				}

				if (error instanceof HTTPError) {
					this.logger.error(
						`[HTTP Error]: ${error.status.toString()} – ${error.message}`,
					);

					const response: ServerCommonErrorResponse = {
						errorType: ServerErrorType.COMMON,
						message: error.message,
					};

					return reply.status(error.status).send(response);
				}

				const statusCode = "statusCode" in error ? error.statusCode : undefined;

				if (isClientErrorStatus(statusCode)) {
					this.logger.warn(
						`[Client Error]: ${statusCode.toString()} – ${error.message}`,
					);

					const response: ServerCommonErrorResponse = {
						errorType: ServerErrorType.COMMON,
						message: error.message,
					};

					return reply.status(statusCode).send(response);
				}

				this.logger.error(error.message);

				const response: ServerCommonErrorResponse = {
					errorType: ServerErrorType.COMMON,
					message: error.message,
				};

				return reply.status(HTTPCode.INTERNAL_SERVER_ERROR).send(response);
			},
		);

		this.app.setNotFoundHandler(async (request, reply) => {
			if (isApiPath(request.url)) {
				const response: ServerCommonErrorResponse = {
					errorType: ServerErrorType.COMMON,
					message: API_ROUTE_NOT_FOUND_MESSAGE,
				};

				return await reply.status(HTTPCode.NOT_FOUND).send(response);
			}

			return await reply.status(HTTPCode.NOT_FOUND).send();
		});
	}

	private initHealthCheck(): void {
		this.app.get("/health", async (_request, reply) => {
			const health = await this.health.getHealthStatus();

			const httpStatus =
				health.status === HealthStatus.OK
					? HTTPCode.OK
					: HTTPCode.SERVICE_UNAVAILABLE;

			return await reply.status(httpStatus).send(health);
		});
	}

	private async initServe(): Promise<void> {
		const staticPath = path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			"../../../../public",
		);

		await this.app.register(fastifyStatic, {
			prefix: "/",
			root: staticPath,
		});

		this.app.setNotFoundHandler(async (request, reply) => {
			if (isApiPath(request.url)) {
				const response: ServerCommonErrorResponse = {
					errorType: ServerErrorType.COMMON,
					message: API_ROUTE_NOT_FOUND_MESSAGE,
				};

				return await reply.status(HTTPCode.NOT_FOUND).send(response);
			}

			return await reply.sendFile("index.html", staticPath);
		});
	}

	private async initSession(): Promise<void> {
		await this.app.register(fastifyCookie);

		await this.app.register(fastifySession, {
			cookie: {
				httpOnly: true,
				sameSite: "lax",
				secure: "auto",
			},
			cookieName: SESSION_COOKIE_NAME,
			saveUninitialized: false,
			secret: this.config.ENV.SESSION.SECRET,
			store: new DatabaseStore(this.database.client),
		});
	}

	private initValidationCompiler(): void {
		this.app.setValidatorCompiler<ValidationSchema>(({ schema }) => {
			return (data: unknown) => {
				const result = schema.safeParse(data);

				return result.success
					? { value: result.data }
					: { error: result.error };
			};
		});
	}

	public addRoute(parameters: ServerApplicationRouteParameters): void {
		const { handler, method, path, validation } = parameters;

		this.app.route({
			handler,
			method,
			schema: {
				...(validation?.body && { body: validation.body }),
				...(validation?.params && { params: validation.params }),
				...(validation?.query && { querystring: validation.query }),
			},
			url: path,
		});

		this.logger.info(`Route: ${method} ${path} is registered`);
	}

	public addRoutes(parameters: ServerApplicationRouteParameters[]): void {
		parameters.forEach((parameter) => {
			this.addRoute(parameter);
		});
	}

	public async init(): Promise<void> {
		this.logger.info("Application initialization…");

		this.database.connect();

		await this.initServe();

		await this.initSession();

		await this.initMiddlewares();

		this.initValidationCompiler();

		this.initRoutes();

		try {
			await this.app.listen({
				host: this.config.ENV.APP.HOST,
				port: this.config.ENV.APP.PORT,
			});

			this.logger.info(
				`Application is listening on PORT – ${this.config.ENV.APP.PORT.toString()}, on ENVIRONMENT – ${
					this.config.ENV.APP.ENVIRONMENT as string
				}.`,
			);
		} catch (error) {
			if (error instanceof Error) {
				this.logger.error(error.message, {
					cause: error.cause,
					stack: error.stack,
				});
			}

			throw error;
		}
	}

	public async initMiddlewares(): Promise<void> {
		await Promise.all(
			this.apis.map(async (api) => {
				this.logger.info(
					`Generate swagger documentation for API ${api.version}`,
				);

				await this.app.register(swagger, {
					mode: "static",
					specification: {
						document: api.generateDoc(
							this.title,
						) as StaticDocumentSpec["document"],
					},
				});

				await this.app.register(swaggerUi, {
					routePrefix: `/${api.version}/documentation`,
				});
			}),
		);
	}

	public initRoutes(): void {
		this.initHealthCheck();

		const routers = this.apis.flatMap((api) => api.routes);

		this.addRoutes(routers);
	}
}

export { BaseServerApplication };
