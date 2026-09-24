import { type Knex } from "knex";

const TABLE_NAME = "documents";

const ColumnName = {
	PROCESSING_ATTEMPT: "processing_attempt",
} as const;

const INITIAL_PROCESSING_ATTEMPT = 0;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(ColumnName.PROCESSING_ATTEMPT);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table
			.integer(ColumnName.PROCESSING_ATTEMPT)
			.notNullable()
			.defaultTo(INITIAL_PROCESSING_ATTEMPT);
	});
}

export { down, up };
