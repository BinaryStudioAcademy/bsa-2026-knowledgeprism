import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TABLE_NAME = "knowledge_nodes";
const DEFAULT_NODE_POSITION = 0;

const ColumnName = {
	CONTENT: "content",
	CONTENT_JSON: "content_json",
	PARENT_ID: "parent_id",
	POSITION: "position",
	TYPE: "type",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.alterTable(TABLE_NAME, (table) => {
		table.text(ColumnName.CONTENT).notNullable().defaultTo("");
		table.dropColumn(ColumnName.CONTENT_JSON);
		table.dropColumn(ColumnName.POSITION);
		table.dropColumn(ColumnName.TYPE);
		table.dropColumn(ColumnName.PARENT_ID);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table
			.integer(ColumnName.PARENT_ID)
			.references("id")
			.inTable(TABLE_NAME)
			.nullable()
			.onDelete("CASCADE");
		table
			.enum(ColumnName.TYPE, [
				KnowledgeNodeType.SECTION,
				KnowledgeNodeType.PAGE,
				KnowledgeNodeType.ENTRY,
			])
			.notNullable()
			.defaultTo(KnowledgeNodeType.ENTRY);
		table.integer(ColumnName.POSITION).notNullable().defaultTo(DEFAULT_NODE_POSITION);
		table.jsonb(ColumnName.CONTENT_JSON).nullable();
	});

	await knex.schema.alterTable(TABLE_NAME, (table) => {
		table.dropColumn(ColumnName.CONTENT);
	});
}

export { down, up };
