import { type Knex } from "knex";

const TABLE_NAME = "integration_changes";

const ColumnName = {
	MERGE_METHOD: "merge_method",
	MERGED_BLOCKS: "merged_blocks",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(ColumnName.MERGED_BLOCKS);
		table.dropColumn(ColumnName.MERGE_METHOD);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.jsonb(ColumnName.MERGED_BLOCKS).nullable();
		table.string(ColumnName.MERGE_METHOD).nullable();
	});
}

export { down, up };
