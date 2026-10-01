import { type Knex } from "knex";

const TableName = {
	DOCUMENTS: "documents",
	GLOSSARY_TERMS: "glossary_terms",
} as const;

const ColumnName = {
	ID: "id",
	ORIGIN: "origin",
	SOURCE_DOCUMENT_ID: "source_document_id",
} as const;

const GlossaryTermOrigin = {
	AI: "AI",
	MANUAL: "MANUAL",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.GLOSSARY_TERMS, (table) => {
		table.dropColumn(ColumnName.SOURCE_DOCUMENT_ID);
		table.dropColumn(ColumnName.ORIGIN);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.GLOSSARY_TERMS, (table) => {
		table
			.enum(ColumnName.ORIGIN, Object.values(GlossaryTermOrigin))
			.notNullable()
			.defaultTo(GlossaryTermOrigin.MANUAL);
		table
			.integer(ColumnName.SOURCE_DOCUMENT_ID)
			.nullable()
			.references(ColumnName.ID)
			.inTable(TableName.DOCUMENTS)
			.onDelete("SET NULL")
			.index();
	});
}

export { down, up };
