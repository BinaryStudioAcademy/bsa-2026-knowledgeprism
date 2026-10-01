import { type DocumentErrorMessage } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

class DocumentProcessingError extends Error {
	public readonly documentErrorMessage: ValueOf<typeof DocumentErrorMessage>;

	public constructor(
		documentErrorMessage: ValueOf<typeof DocumentErrorMessage>,
	) {
		super(documentErrorMessage);
		this.name = "DocumentProcessingError";
		this.documentErrorMessage = documentErrorMessage;
	}
}

export { DocumentProcessingError };
