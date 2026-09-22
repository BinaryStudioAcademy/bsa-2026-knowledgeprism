import { type HTTP, type HTTPOptions } from "./libs/types/types.js";

class BaseHTTP implements HTTP {
	public load(path: string, options: HTTPOptions): Promise<Response> {
		const { headers, method, payload, signal } = options;

		return fetch(path, {
			body: payload,
			headers,
			method,
			...(signal && { signal }),
		});
	}
}

export { BaseHTTP };
