import { type Knex } from "knex";

const TableName = {
	EXTRACTION_ITEMS: "extraction_items",
	INTEGRATION_CHANGES: "integration_changes",
} as const;

const ColumnName = {
	DUPLICATE_OF_EXTRACTION_ITEM_ID: "duplicate_of_extraction_item_id",
	ID: "id",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.INTEGRATION_CHANGES, (table) => {
		table.dropColumn(ColumnName.DUPLICATE_OF_EXTRACTION_ITEM_ID);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.INTEGRATION_CHANGES, (table) => {
		table
			.integer(ColumnName.DUPLICATE_OF_EXTRACTION_ITEM_ID)
			.nullable()
			.references(ColumnName.ID)
			.inTable(TableName.EXTRACTION_ITEMS)
			.onDelete("SET NULL")
			.index();
	});
}

export { down, up };
