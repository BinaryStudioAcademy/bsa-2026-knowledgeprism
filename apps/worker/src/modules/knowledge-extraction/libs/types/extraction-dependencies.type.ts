import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";

import { type Logger } from "~/logger/libs/types/logger.type.js";

import { type ExtractionContext } from "./extraction-context.type.js";

type ExtractionDependencies = {
	context?: ExtractionContext;
	invoke: (
		content: string,
		previousHeading?: null | string,
	) => Promise<unknown>;
	logger: Logger;
	onProgress?: (progress: DocumentProcessingProgressDto) => Promise<void>;
	pause: (milliseconds: number) => Promise<void>;
};

export { type ExtractionDependencies };
