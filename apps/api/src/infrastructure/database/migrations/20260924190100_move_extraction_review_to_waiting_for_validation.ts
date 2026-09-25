import { DocumentStatus } from "@knowledgeprism/constants";
import { type Knex } from "knex";

const ColumnName = {
	DOCUMENT_ID: "document_id",
	ID: "id",
	STATUS: "status",
} as const;

const TableName = {
	DOCUMENTS: "documents",
	INTEGRATION_CHANGES: "integration_changes",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex(TableName.DOCUMENTS)
		.where(ColumnName.STATUS, DocumentStatus.WAITING_FOR_VALIDATION)
		.update({ [ColumnName.STATUS]: DocumentStatus.WAITING_FOR_APPROVAL });
}

async function up(knex: Knex): Promise<void> {
	await knex(TableName.DOCUMENTS)
		.where(ColumnName.STATUS, DocumentStatus.WAITING_FOR_APPROVAL)
		.whereNotExists(
			knex(TableName.INTEGRATION_CHANGES)
				.select(ColumnName.ID)
				.whereRaw("??.?? = ??.??", [
					TableName.INTEGRATION_CHANGES,
					ColumnName.DOCUMENT_ID,
					TableName.DOCUMENTS,
					ColumnName.ID,
				]),
		)
		.update({ [ColumnName.STATUS]: DocumentStatus.WAITING_FOR_VALIDATION });
}

export { down, up };
