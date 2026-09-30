const HttpStatus = {
	SERVER_ERROR_END: 600,
	SERVER_ERROR_START: 500,
	TOO_MANY_REQUESTS: 429,
} as const;

const TRANSIENT_ERROR_NAMES = new Set([
	"InternalServerException",
	"ModelErrorException",
	"ModelNotReadyException",
	"ModelTimeoutException",
	"ServiceUnavailableException",
	"ThrottlingException",
	"TimeoutError",
]);

const isTransientExtractionError = (error: unknown): boolean => {
	if (typeof error !== "object" || error === null) {
		return false;
	}

	if (
		"name" in error &&
		typeof error.name === "string" &&
		TRANSIENT_ERROR_NAMES.has(error.name)
	) {
		return true;
	}

	if (
		!("$metadata" in error) ||
		typeof error.$metadata !== "object" ||
		error.$metadata === null ||
		!("httpStatusCode" in error.$metadata) ||
		typeof error.$metadata.httpStatusCode !== "number"
	) {
		return false;
	}

	const status = error.$metadata.httpStatusCode;

	return (
		status === HttpStatus.TOO_MANY_REQUESTS ||
		(status >= HttpStatus.SERVER_ERROR_START &&
			status < HttpStatus.SERVER_ERROR_END)
	);
};

export { isTransientExtractionError };
