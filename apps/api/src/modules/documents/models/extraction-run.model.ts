import { type ValueOf } from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

import { type ExtractionRunStatus } from "../libs/constants/extraction-run-status.constant.js";

class ExtractionRunModel extends AbstractModel {
	public chunkCount!: number;

	public documentId!: number;

	public processingAttempt!: number;

	public status!: ValueOf<typeof ExtractionRunStatus>;

	public static override get tableName(): string {
		return DatabaseTableName.EXTRACTION_RUNS;
	}
}

export { ExtractionRunModel };
