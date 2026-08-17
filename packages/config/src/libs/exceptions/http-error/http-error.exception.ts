import { type HTTPCode } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { ApplicationError } from "../application-error/application-error.exception.js";

type Constructor = {
	cause?: unknown;
	message: string;
	status: ValueOf<typeof HTTPCode>;
};

class HTTPError extends ApplicationError {
	public status: ValueOf<typeof HTTPCode>;

	public constructor({ cause, message, status }: Constructor) {
		super({
			cause,
			message,
		});

		this.status = status;
	}
}

export { HTTPError };
