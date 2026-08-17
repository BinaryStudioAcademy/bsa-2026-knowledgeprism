import { HTTPError as LibraryHTTPError } from "@knowledgeprism/config";

import { type ServerErrorType } from "~/lib/enums/enums.js";
import { type ServerErrorDetail, type ValueOf } from "~/lib/types/types.js";

import { type HTTPCode } from "../enums/enums.js";

type Constructor = {
	cause?: unknown;
	details: ServerErrorDetail[];
	errorType: ValueOf<typeof ServerErrorType>;
	message: string;
	status: ValueOf<typeof HTTPCode>;
};

class HTTPError extends LibraryHTTPError {
	public details: ServerErrorDetail[];

	public errorType: ValueOf<typeof ServerErrorType>;

	public constructor({
		cause,
		details,
		errorType,
		message,
		status,
	}: Constructor) {
		super({
			cause,
			message,
			status,
		});

		this.errorType = errorType;
		this.details = details;
	}
}

export { HTTPError };
