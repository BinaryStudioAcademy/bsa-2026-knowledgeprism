import { KnowledgeValidationRule } from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TABLE_NAME = "knowledge_nodes";

const ColumnName = {
	CONTENT: "content",
	CREATED_AT: "created_at",
	CREATED_BY: "created_by",
	ID: "id",
	PROJECT_ID: "project_id",
	TITLE: "title",
	UPDATED_AT: "updated_at",
	UPDATED_BY: "updated_by",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(TABLE_NAME);
}

function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(TABLE_NAME, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.PROJECT_ID)
			.references("id")
			.inTable("projects")
			.notNullable()
			.onDelete("CASCADE");
		table
			.string(ColumnName.TITLE, KnowledgeValidationRule.TITLE_MAXIMUM_LENGTH)
			.notNullable();
		table.text(ColumnName.CONTENT).notNullable();
		table
			.integer(ColumnName.CREATED_BY)
			.references("id")
			.inTable("users")
			.nullable()
			.onDelete("SET NULL");
		table
			.integer(ColumnName.UPDATED_BY)
			.references("id")
			.inTable("users")
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
