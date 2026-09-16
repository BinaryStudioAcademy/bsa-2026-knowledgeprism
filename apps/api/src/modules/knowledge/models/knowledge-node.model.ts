import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class KnowledgeNodeModel extends AbstractModel {
	public contentJson!: Record<string, unknown>[];

	public createdBy!: null | number;

	public projectId!: number;

	public title!: string;

	public updatedBy!: null | number;

	public static override get tableName(): string {
		return DatabaseTableName.KNOWLEDGE_NODES;
	}
}

export { KnowledgeNodeModel };
