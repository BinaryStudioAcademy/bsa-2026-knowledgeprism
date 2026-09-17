import { type KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type KnowledgeNodeContentDto,
	type ValueOf,
} from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class KnowledgeNodeModel extends AbstractModel {
	public contentJson!: KnowledgeNodeContentDto;

	public createdBy!: null | number;

	public parentId!: null | number;

	public position!: number;

	public projectId!: number;

	public title!: string;

	public type!: ValueOf<typeof KnowledgeNodeType>;

	public updatedBy!: null | number;

	public static override get jsonAttributes(): string[] {
		return ["contentJson"];
	}

	public static override get tableName(): string {
		return DatabaseTableName.KNOWLEDGE_NODES;
	}
}

export { KnowledgeNodeModel };
