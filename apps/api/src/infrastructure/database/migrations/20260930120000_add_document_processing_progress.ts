import { type Knex } from "knex";

const TABLE_NAME = "documents";
const COLUMN_NAME = "processing_progress";

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(COLUMN_NAME);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.jsonb(COLUMN_NAME).nullable();
	});
}

export { down, up };
