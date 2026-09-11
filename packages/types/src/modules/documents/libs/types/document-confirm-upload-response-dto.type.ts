import { type DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/types.js";

type DocumentConfirmUploadResponseDto = {
	blocksCount: number;
	documentId: number;
	status: ValueOf<typeof DocumentStatus>;
};

export { type DocumentConfirmUploadResponseDto };
