import type { FastifyReply, FastifyRequest } from "fastify";

import { AuthValidationMessage } from "@knowledgeprism/constants";

import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { type ServerApplicationRouteParameters } from "~/infrastructure/server-application/server-application.js";
import { UserModel } from "~/modules/users/models/user.model.js";

import {
	type APIHandlerOptions,
	type Controller,
	type ControllerRouteParameters,
} from "./libs/types/types.js";

class BaseController implements Controller {
	private apiUrl: string;

	private logger: Logger;

	public routes: ServerApplicationRouteParameters[];

	public constructor(logger: Logger, apiPath: string) {
		this.logger = logger;
		this.apiUrl = apiPath;
		this.routes = [];
	}

	protected getAuthenticatedSessionContext(options: APIHandlerOptions): {
		organisationId: number;
		userId: number;
	} {
		const { organisationId, userId } = options.session;

		if (!organisationId || !userId) {
			throw new HTTPError({
				message: AuthValidationMessage.UNAUTHORIZED,
				status: HTTPCode.UNAUTHORIZED,
			});
		}

		return {
			organisationId,
			userId,
		};
	}

	private isSelfRequest(
		userId: number | undefined,
		allowSelf: boolean | undefined,
		parameters: unknown,
	): boolean {
		if (
			!userId ||
			!allowSelf ||
			!parameters ||
			typeof parameters !== "object"
		) {
			return false;
		}

		if (!("id" in parameters)) {
			return false;
		}

		return Number((parameters as Record<string, unknown>)["id"]) === userId;
	}

	private async mapHandler(
		route: ControllerRouteParameters,
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		this.logger.info(`${request.method.toUpperCase()} on ${request.url}`);

		const handlerOptions = this.mapRequest(request);

		if (route.allowedRoles) {
			let { organisationRole, userId } = handlerOptions.session;

			if (userId && organisationRole === undefined) {
				const user = await UserModel.query().findById(userId);

				if (user) {
					organisationRole = user.organisationRole;
					request.session.organisationRole = organisationRole;
					handlerOptions.session.organisationRole = organisationRole;
				}
			}

			const isAllowedByRole = Boolean(
				organisationRole && route.allowedRoles.includes(organisationRole),
			);

			const isSelf = this.isSelfRequest(
				userId,
				route.allowSelf,
				handlerOptions.params,
			);

			if (!isAllowedByRole && !isSelf) {
				throw new HTTPError({
					message: AuthValidationMessage.FORBIDDEN,
					status: HTTPCode.FORBIDDEN,
				});
			}
		}

		const { payload, status } = await route.handler(handlerOptions);

		return await reply.status(status).send(payload);
	}

	private mapRequest(request: FastifyRequest): APIHandlerOptions {
		const { body, params, query, session } = request;

		return {
			body,
			params,
			query,
			session,
		};
	}

	public addRoute(options: ControllerRouteParameters): void {
		const { path } = options;
		const fullPath = this.apiUrl + path;

		this.routes.push({
			...options,
			handler: (request, reply) => this.mapHandler(options, request, reply),
			path: fullPath,
		});
	}
}

export { BaseController };
