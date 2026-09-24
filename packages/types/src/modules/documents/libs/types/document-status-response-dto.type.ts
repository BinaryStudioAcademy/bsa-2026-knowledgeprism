import { DocumentSourceType, DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";

type DocumentStatusResponseDto = {
	createdAt: string;
	errorMessage: null | string;
	id: number;
	name: string;
	projectId: number;
	sourceType: ValueOf<typeof DocumentSourceType>;
	status: ValueOf<typeof DocumentStatus>;
	updatedAt: string;
};

export { type DocumentStatusResponseDto };
