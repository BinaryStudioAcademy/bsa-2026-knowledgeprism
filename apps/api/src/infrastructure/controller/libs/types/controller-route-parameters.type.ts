import { type OrganisationRole } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { type HTTPMethod } from "~/infrastructure/http/http.js";
import { type ValidationSchema } from "~/shared/types/types.js";

import { type APIHandler } from "./api-handler.type.js";

type ControllerRouteParameters = {
	allowedRoles?: ValueOf<typeof OrganisationRole>[];
	allowSelf?: boolean;
	handler: APIHandler;
	method: HTTPMethod;
	path: string;
	validation?: {
		body?: ValidationSchema;
		params?: ValidationSchema;
		query?: ValidationSchema;
	};
};

export { type ControllerRouteParameters };
