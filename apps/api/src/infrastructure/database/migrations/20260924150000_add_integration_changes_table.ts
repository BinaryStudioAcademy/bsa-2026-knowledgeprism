import {
	IntegrationChangeType,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TABLE_NAME = "integration_changes";

const ColumnName = {
	CREATED_AT: "created_at",
	DOCUMENT_ID: "document_id",
	EXPLANATION: "explanation",
	EXTRACTION_ITEM_ID: "extraction_item_id",
	ID: "id",
	INCOMING_CONTENT: "incoming_content",
	INCOMING_TITLE: "incoming_title",
	LIVE_CONTENT: "live_content",
	LIVE_TITLE: "live_title",
	MATCHED_NODE_ID: "matched_node_id",
	SCORE: "score",
	TYPE: "type",
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
			.integer(ColumnName.EXTRACTION_ITEM_ID)
			.references("id")
			.inTable("extraction_items")
			.notNullable()
			.onDelete("CASCADE")
			.unique();
		table
			.enum(ColumnName.TYPE, Object.values(IntegrationChangeType))
			.notNullable();
		table
			.integer(ColumnName.MATCHED_NODE_ID)
			.references("id")
			.inTable("knowledge_nodes")
			.nullable()
			.onDelete("SET NULL");
		table.float(ColumnName.SCORE).nullable();
		table.text(ColumnName.EXPLANATION).notNullable();
		table
			.string(
				ColumnName.INCOMING_TITLE,
				KnowledgeValidationRule.TITLE_MAXIMUM_LENGTH,
			)
			.notNullable();
		table.text(ColumnName.INCOMING_CONTENT).notNullable();
		table
			.string(
				ColumnName.LIVE_TITLE,
				KnowledgeValidationRule.TITLE_MAXIMUM_LENGTH,
			)
			.nullable();
		table.text(ColumnName.LIVE_CONTENT).nullable();
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
