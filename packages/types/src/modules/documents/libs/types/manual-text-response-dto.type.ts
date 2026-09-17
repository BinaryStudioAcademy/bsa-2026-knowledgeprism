import { DocumentSourceType, DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/value-of.type.js";

type ManualTextResponseDto = {
	createdAt: string;
	errorMessage: null | string;
	id: number;
	projectId: string;
	sourceType: ValueOf<typeof DocumentSourceType>;
	status: ValueOf<typeof DocumentStatus>;
	title: null | string;
	updatedAt: string;
};

export { type ManualTextResponseDto };
