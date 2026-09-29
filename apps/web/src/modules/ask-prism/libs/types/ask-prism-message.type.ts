import { type AskPrismSourceDto } from "@knowledgeprism/types";

import { type DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

type AskPrismErrorType = "connection" | "not_found" | null;

type AskPrismMessage = {
	answer: null | string;
	dataStatus: ValueOf<typeof DataStatus>;
	errorType: AskPrismErrorType;
	id: string;
	query: string;
	sources: AskPrismSourceDto[];
};

export { type AskPrismErrorType, type AskPrismMessage };
