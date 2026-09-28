import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class GlossaryTermRelationModel extends AbstractModel {
	public projectId!: number;

	public relatedTermId!: number;

	public termId!: number;

	public static override get tableName(): string {
		return DatabaseTableName.GLOSSARY_TERM_RELATIONS;
	}
}

export { GlossaryTermRelationModel };
