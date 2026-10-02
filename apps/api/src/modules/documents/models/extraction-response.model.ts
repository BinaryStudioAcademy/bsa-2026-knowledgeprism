import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class ExtractionResponseModel extends AbstractModel {
	public attempt!: number;

	public documentChunkId!: number;

	public errorReason!: null | string;

	public rawResponse!: null | string;

	public splitPart!: null | number;

	public static override get tableName(): string {
		return DatabaseTableName.EXTRACTION_RESPONSES;
	}
}

export { ExtractionResponseModel };
