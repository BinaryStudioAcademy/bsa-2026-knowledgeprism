const POSTGRES_UNIQUE_VIOLATION_CODE = "23505";

const readErrorCode = (error: unknown): null | string => {
	if (typeof error !== "object" || error === null || !("code" in error)) {
		return null;
	}

	return typeof error.code === "string" ? error.code : null;
};

const isUniqueViolation = (error: unknown): boolean => {
	if (readErrorCode(error) === POSTGRES_UNIQUE_VIOLATION_CODE) {
		return true;
	}

	if (
		typeof error !== "object" ||
		error === null ||
		!("nativeError" in error)
	) {
		return false;
	}

	return readErrorCode(error.nativeError) === POSTGRES_UNIQUE_VIOLATION_CODE;
};

export { isUniqueViolation };
