import { DocumentSourceType, DocumentStatus } from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TABLE_NAME = "documents";
const INDEX_NAME = "documents_processing_manual_text_hash_unique";

const ColumnName = {
	CONTENT_HASH: "content_hash",
	PROJECT_ID: "project_id",
	SOURCE_TYPE: "source_type",
	STATUS: "status",
	UPLOADED_BY: "uploaded_by",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.raw(`DROP INDEX IF EXISTS ${INDEX_NAME}`);
}

async function up(knex: Knex): Promise<void> {
	await knex.raw(
		`
			CREATE UNIQUE INDEX ${INDEX_NAME}
			ON ${TABLE_NAME} (
				${ColumnName.PROJECT_ID},
				${ColumnName.UPLOADED_BY},
				${ColumnName.CONTENT_HASH}
			)
			WHERE ${ColumnName.STATUS} = ?
				AND ${ColumnName.SOURCE_TYPE} = ?
				AND ${ColumnName.CONTENT_HASH} IS NOT NULL
		`,
		[DocumentStatus.PROCESSING, DocumentSourceType.MANUAL],
	);
}

export { down, up };
