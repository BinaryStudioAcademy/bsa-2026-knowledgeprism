import { type DocumentStatusResponseDto } from "@knowledgeprism/types";

import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";

const toDocumentStatusResponse = (
	document: DocumentEntity,
): DocumentStatusResponseDto => {
	const {
		createdAt,
		errorMessage,
		id,
		name,
		projectId,
		sourceType,
		status,
		updatedAt,
	} = document.toObject();

	return {
		createdAt: createdAt.toISOString(),
		errorMessage,
		id,
		name,
		projectId,
		sourceType,
		status,
		updatedAt: updatedAt.toISOString(),
	};
};

export { toDocumentStatusResponse };
