import { type Knex } from "knex";

const TABLE_NAME = "document_blocks";
const DOCUMENTS_TABLE_NAME = "documents";

const ColumnName = {
	CONTENT: "content",
	CREATED_AT: "created_at",
	DOCUMENT_ID: "document_id",
	ID: "id",
	PAGE_NUMBER: "page_number",
	UPDATED_AT: "updated_at",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(TABLE_NAME);
}

function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(TABLE_NAME, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.DOCUMENT_ID)
			.notNullable()
			.references("id")
			.inTable(DOCUMENTS_TABLE_NAME)
			.onDelete("CASCADE")
			.index();
		table.integer(ColumnName.PAGE_NUMBER).notNullable();
		table.text(ColumnName.CONTENT).notNullable();
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table.unique([ColumnName.DOCUMENT_ID, ColumnName.PAGE_NUMBER]);
	});
}

export { down, up };
