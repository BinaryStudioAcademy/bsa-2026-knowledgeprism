import { type EmbeddingVector } from "@knowledgeprism/worker";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class GlossaryTermModel extends AbstractModel {
	public createdBy!: null | number;

	public definition!: string;

	public embedding!: EmbeddingVector | null;

	public name!: string;

	public projectId!: number;

	public updatedBy!: null | number;

	public static override get jsonAttributes(): string[] {
		return ["embedding"];
	}

	public static override get tableName(): string {
		return DatabaseTableName.GLOSSARY_TERMS;
	}
}

export { GlossaryTermModel };
