type Constructor = {
	contentType: string;
};

class UnsupportedDocumentFormatError extends Error {
	public constructor({ contentType }: Constructor) {
		super(`Unsupported document format: ${contentType}.`);
		this.name = "UnsupportedDocumentFormatError";
	}
}

export { UnsupportedDocumentFormatError };
