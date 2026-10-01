import { type Knex } from "knex";

const TABLE_NAME = "extraction_items";
const COLUMN_NAME = "blocks";
const EMPTY_BLOCKS = "'[]'::jsonb";

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(COLUMN_NAME);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.jsonb(COLUMN_NAME).notNullable().defaultTo(knex.raw(EMPTY_BLOCKS));
	});
}

export { down, up };
