import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class DocumentBlockModel extends AbstractModel {
	public content!: string;

	public documentId!: number;

	public pageNumber!: number;

	public static override get tableName(): string {
		return DatabaseTableName.DOCUMENT_BLOCKS;
	}
}

export { DocumentBlockModel };
