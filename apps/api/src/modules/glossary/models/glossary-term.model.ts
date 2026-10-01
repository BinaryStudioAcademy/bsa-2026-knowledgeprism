import { type GlossaryTermOrigin } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
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

	public origin!: ValueOf<typeof GlossaryTermOrigin>;

	public projectId!: number;

	public sourceDocumentId!: null | number;

	public sourceDocumentName?: null | string;

	public updatedBy!: null | number;

	public static override get jsonAttributes(): string[] {
		return ["embedding"];
	}

	public static override get tableName(): string {
		return DatabaseTableName.GLOSSARY_TERMS;
	}
}

export { GlossaryTermModel };
