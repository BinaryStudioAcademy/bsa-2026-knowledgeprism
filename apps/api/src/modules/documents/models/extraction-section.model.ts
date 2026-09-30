import { type KnowledgeNodeType } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class ExtractionSectionModel extends AbstractModel {
	public documentId!: number;

	public position!: number;

	public title!: string;

	public type!: ValueOf<typeof KnowledgeNodeType>;

	public static override get tableName(): string {
		return DatabaseTableName.EXTRACTION_SECTIONS;
	}
}

export { ExtractionSectionModel };
