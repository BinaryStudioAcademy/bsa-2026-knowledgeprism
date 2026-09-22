import { type HTTPMethod } from "./http-method.type.js";

type HTTPOptions = {
	headers: Headers;
	method: HTTPMethod;
	payload: BodyInit | null;
	signal?: AbortSignal | undefined;
};

export { type HTTPOptions };
