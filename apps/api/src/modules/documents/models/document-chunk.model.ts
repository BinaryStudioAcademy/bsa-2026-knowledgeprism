import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class DocumentChunkModel extends AbstractModel {
	public content!: string;

	public extractionRunId!: number;

	public pageEnd!: number;

	public pageStart!: number;

	public position!: number;

	public sectionTitle!: null | string;

	public translatedContent!: null | string;

	public static override get tableName(): string {
		return DatabaseTableName.DOCUMENT_CHUNKS;
	}
}

export { DocumentChunkModel };
