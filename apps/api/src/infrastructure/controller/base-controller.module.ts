import type { FastifyReply, FastifyRequest } from "fastify";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { type ServerApplicationRouteParameters } from "~/infrastructure/server-application/server-application.js";

import {
	type APIHandler,
	type APIHandlerOptions,
	type Controller,
	type ControllerRouteParameters,
	type RequestSession,
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

	private getRequestSession(request: FastifyRequest): RequestSession {
		const sessionValue: unknown = Reflect.get(request, "session");

		if (typeof sessionValue !== "object" || sessionValue === null) {
			return {};
		}

		if (!("userId" in sessionValue)) {
			return {};
		}

		const { userId } = sessionValue;

		if (typeof userId !== "number") {
			return {};
		}

		return {
			userId,
		};
	}

	private async mapHandler(
		handler: APIHandler,
		request: FastifyRequest,
		reply: FastifyReply,
	): Promise<void> {
		this.logger.info(`${request.method.toUpperCase()} on ${request.url}`);

		const handlerOptions = this.mapRequest(request);
		const { payload, status } = await handler(handlerOptions);

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
		const { handler, path } = options;
		const fullPath = this.apiUrl + path;

		this.routes.push({
			...options,
			handler: (request, reply) => this.mapHandler(handler, request, reply),
			path: fullPath,
		});
	}
}

export { BaseController };
