import { type Knex } from "knex";

const ExtractionTableName = "extraction_items";
const IntegrationTableName = "integration_changes";

const ColumnName = {
	HEADING: "heading",
	PLACEMENT: "placement",
} as const;

const EMPTY_PLACEMENT = `'${JSON.stringify({
	matches: [],
	parentId: null,
	parentTitle: null,
	proposesParent: false,
})}'::jsonb`;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(ExtractionTableName, (table) => {
		table.dropColumn(ColumnName.HEADING);
	});
	await knex.schema.alterTable(IntegrationTableName, (table) => {
		table.dropColumn(ColumnName.PLACEMENT);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(ExtractionTableName, (table) => {
		table.text(ColumnName.HEADING).nullable();
	});
	await knex.schema.alterTable(IntegrationTableName, (table) => {
		table
			.jsonb(ColumnName.PLACEMENT)
			.notNullable()
			.defaultTo(knex.raw(EMPTY_PLACEMENT));
	});
}

export { down, up };
