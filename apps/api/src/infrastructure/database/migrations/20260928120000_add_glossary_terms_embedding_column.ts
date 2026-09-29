import { type Knex } from "knex";

const TABLE_NAME = "glossary_terms";

const ColumnName = {
	EMBEDDING: "embedding",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(ColumnName.EMBEDDING);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.jsonb(ColumnName.EMBEDDING).nullable();
	});
}

export { down, up };
