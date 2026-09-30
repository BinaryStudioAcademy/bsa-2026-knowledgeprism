import { type Logger } from "~/logger/libs/types/logger.type.js";

import { type ExtractionContext } from "./extraction-context.type.js";

type ExtractionDependencies = {
	context?: ExtractionContext;
	invoke: (content: string) => Promise<unknown>;
	logger: Logger;
	pause: (milliseconds: number) => Promise<void>;
};

export { type ExtractionDependencies };
