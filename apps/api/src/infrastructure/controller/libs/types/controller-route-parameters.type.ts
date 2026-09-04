import { type HTTPMethod } from "~/infrastructure/http/http.js";
import { type ValidationSchema } from "~/shared/types/types.js";

import { type APIHandler } from "./api-handler.type.js";

type ControllerRouteParameters = {
	handler: APIHandler;
	method: HTTPMethod;
	path: string;
	validation?: {
		body?: ValidationSchema;
		params?: ValidationSchema;
	};
};

export { type ControllerRouteParameters };
