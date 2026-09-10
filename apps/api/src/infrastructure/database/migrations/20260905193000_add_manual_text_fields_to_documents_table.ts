import { DocumentSourceType } from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TABLE_NAME = "documents";

const ColumnName = {
	CONTENT: "content",
	CONTENT_HASH: "content_hash",
	ERROR_MESSAGE: "error_message",
	S3_KEY: "s3_key",
	SOURCE_TYPE: "source_type",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(ColumnName.CONTENT);
		table.dropColumn(ColumnName.CONTENT_HASH);
		table.dropColumn(ColumnName.ERROR_MESSAGE);
		table.dropColumn(ColumnName.SOURCE_TYPE);
	});
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.string(ColumnName.S3_KEY).notNullable().alter();
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table
			.string(ColumnName.SOURCE_TYPE)
			.notNullable()
			.defaultTo(DocumentSourceType.UPLOAD);
		table.text(ColumnName.CONTENT).nullable();
		table.string(ColumnName.CONTENT_HASH).nullable();
		table.text(ColumnName.ERROR_MESSAGE).nullable();
		table.index([ColumnName.CONTENT_HASH, ColumnName.SOURCE_TYPE]);
	});
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.string(ColumnName.S3_KEY).nullable().alter();
	});
}

export { down, up };
