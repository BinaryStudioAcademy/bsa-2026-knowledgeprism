import {
	ExtractionItemStatus,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TABLE_NAME = "extraction_items";

const ColumnName = {
	CONFIDENCE: "confidence",
	CREATED_AT: "created_at",
	DOCUMENT_ID: "document_id",
	ID: "id",
	KNOWLEDGE_NODE_ID: "knowledge_node_id",
	RATIONALE: "rationale",
	SOURCE_EXCERPT: "source_excerpt",
	SOURCE_PAGE_NUMBER: "source_page_number",
	STATUS: "status",
	TEXT: "text",
	TITLE: "title",
	UPDATED_AT: "updated_at",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(TABLE_NAME);
}

function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(TABLE_NAME, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.DOCUMENT_ID)
			.references("id")
			.inTable("documents")
			.notNullable()
			.onDelete("CASCADE")
			.index();
		table
			.string(ColumnName.TITLE, KnowledgeValidationRule.TITLE_MAXIMUM_LENGTH)
			.notNullable();
		table.text(ColumnName.TEXT).notNullable();
		table.text(ColumnName.RATIONALE).notNullable();
		table.text(ColumnName.SOURCE_EXCERPT).notNullable();
		table.float(ColumnName.CONFIDENCE).notNullable();
		table.integer(ColumnName.SOURCE_PAGE_NUMBER).notNullable();
		table
			.enum(ColumnName.STATUS, Object.values(ExtractionItemStatus))
			.notNullable()
			.defaultTo(ExtractionItemStatus.PENDING);
		table
			.integer(ColumnName.KNOWLEDGE_NODE_ID)
			.references("id")
			.inTable("knowledge_nodes")
			.nullable()
			.onDelete("SET NULL");
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
	});
}

export { down, up };
