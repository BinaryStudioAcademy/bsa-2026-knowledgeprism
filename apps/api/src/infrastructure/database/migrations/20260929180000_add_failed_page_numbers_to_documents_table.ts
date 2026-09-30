import { type Knex } from "knex";

const TABLE_NAME = "documents";

const ColumnName = {
	FAILED_PAGE_NUMBERS: "failed_page_numbers",
} as const;

const EMPTY_INTEGER_ARRAY_SQL = "'{}'::integer[]";

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(ColumnName.FAILED_PAGE_NUMBERS);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table
			.specificType(ColumnName.FAILED_PAGE_NUMBERS, "integer[]")
			.notNullable()
			.defaultTo(knex.raw(EMPTY_INTEGER_ARRAY_SQL));
	});
}

export { down, up };
