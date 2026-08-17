import { type HTTPCode } from "~/infrastructure/http/http.js";
import { type ValueOf } from "~/shared/types/types.js";

type APIHandlerResponse = {
	payload: unknown;
	status: ValueOf<typeof HTTPCode>;
};

export { type APIHandlerResponse };
