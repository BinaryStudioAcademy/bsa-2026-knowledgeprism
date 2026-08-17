import { type FastifyReply, type FastifyRequest } from "fastify";

import { type HTTPMethod } from "~/infrastructure/http/http.js";
import { type ValidationSchema } from "~/shared/types/types.js";

type ServerApplicationRouteParameters = {
	handler: (
		request: FastifyRequest,
		reply: FastifyReply,
	) => Promise<void> | void;
	method: HTTPMethod;
	path: string;
	validation?: {
		body?: ValidationSchema;
	};
};

export { type ServerApplicationRouteParameters };
