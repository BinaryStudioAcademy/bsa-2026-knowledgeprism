import { DocumentStatus } from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TABLE_NAME = "documents";

const ColumnName = {
	CREATED_AT: "created_at",
	ID: "id",
	MIME_TYPE: "mime_type",
	NAME: "name",
	PROJECT_ID: "project_id",
	S3_KEY: "s3_key",
	SIZE_IN_BYTES: "size_in_bytes",
	STATUS: "status",
	UPDATED_AT: "updated_at",
	UPLOADED_BY: "uploaded_by",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(TABLE_NAME);
}

function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(TABLE_NAME, (table) => {
		table.increments(ColumnName.ID).primary();
		table.string(ColumnName.PROJECT_ID).notNullable().index();
		table.string(ColumnName.NAME).notNullable();
		table.string(ColumnName.MIME_TYPE).notNullable();
		table.integer(ColumnName.SIZE_IN_BYTES).nullable();
		table.string(ColumnName.S3_KEY).unique().notNullable();
		table.integer(ColumnName.UPLOADED_BY).nullable();
		table
			.string(ColumnName.STATUS)
			.notNullable()
			.defaultTo(DocumentStatus.UPLOADED);
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
	});
}

export { down, up };
