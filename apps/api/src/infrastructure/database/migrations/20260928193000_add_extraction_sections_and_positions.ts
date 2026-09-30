import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type Knex } from "knex";

const EXTRACTION_ITEMS_TABLE = "extraction_items";
const EXTRACTION_SECTIONS_TABLE = "extraction_sections";
const DOCUMENTS_TABLE = "documents";

const ColumnName = {
	CREATED_AT: "created_at",
	DOCUMENT_ID: "document_id",
	EXTRACTION_SECTION_ID: "extraction_section_id",
	ID: "id",
	POSITION: "position",
	TITLE: "title",
	TYPE: "type",
	UPDATED_AT: "updated_at",
} as const;

const DEFAULT_POSITION = 0;
const TITLE_MAXIMUM_LENGTH = 255;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(EXTRACTION_ITEMS_TABLE, (table) => {
		table.dropColumn(ColumnName.POSITION);
		table.dropColumn(ColumnName.EXTRACTION_SECTION_ID);
	});

	await knex.schema.dropTableIfExists(EXTRACTION_SECTIONS_TABLE);
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(EXTRACTION_SECTIONS_TABLE, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.DOCUMENT_ID)
			.references("id")
			.inTable(DOCUMENTS_TABLE)
			.notNullable()
			.onDelete("CASCADE")
			.index();
		table.string(ColumnName.TITLE, TITLE_MAXIMUM_LENGTH).notNullable();
		table
			.enum(ColumnName.TYPE, Object.values(KnowledgeNodeType))
			.notNullable()
			.defaultTo(KnowledgeNodeType.SECTION);
		table.integer(ColumnName.POSITION).notNullable();
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());

		table.unique([ColumnName.DOCUMENT_ID, ColumnName.POSITION]);
	});

	await knex.schema.alterTable(EXTRACTION_ITEMS_TABLE, (table) => {
		table
			.integer(ColumnName.EXTRACTION_SECTION_ID)
			.references("id")
			.inTable(EXTRACTION_SECTIONS_TABLE)
			.nullable()
			.onDelete("SET NULL")
			.index();
		table
			.integer(ColumnName.POSITION)
			.notNullable()
			.defaultTo(DEFAULT_POSITION);
	});
}

export { down, up };
