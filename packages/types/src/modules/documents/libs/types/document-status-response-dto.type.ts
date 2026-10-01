import { DocumentSourceType, DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";
import { type DocumentProcessingProgressDto } from "./document-processing-progress-dto.type.js";

type DocumentStatusResponseDto = {
	createdAt: string;
	errorMessage: null | string;
	id: number;
	name: string;
	processingAttempt: number;
	processingProgress: DocumentProcessingProgressDto | null;
	projectId: number;
	sourceType: ValueOf<typeof DocumentSourceType>;
	status: ValueOf<typeof DocumentStatus>;
	updatedAt: string;
};

export { type DocumentStatusResponseDto };
