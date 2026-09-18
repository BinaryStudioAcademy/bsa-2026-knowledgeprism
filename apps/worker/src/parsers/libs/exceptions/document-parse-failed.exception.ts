type Constructor = {
	cause?: unknown;
	message: string;
};

class DocumentParseFailedError extends Error {
	public constructor({ cause, message }: Constructor) {
		super(message, { cause });
		this.name = "DocumentParseFailedError";
	}
}

export { DocumentParseFailedError };
