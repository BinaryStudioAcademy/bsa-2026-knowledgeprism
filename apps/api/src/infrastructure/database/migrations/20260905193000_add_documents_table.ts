import {
	DocumentSourceType,
	DocumentStatus,
	DocumentValidationRule,
} from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TABLE_NAME = "documents";
const USERS_TABLE_NAME = "users";

const ColumnName = {
	CONTENT: "content",
	CONTENT_HASH: "content_hash",
	CREATED_AT: "created_at",
	CREATED_BY_USER_ID: "created_by_user_id",
	ERROR_MESSAGE: "error_message",
	ID: "id",
	PROJECT_ID: "project_id",
	SOURCE_TYPE: "source_type",
	STATUS: "status",
	TITLE: "title",
	UPDATED_AT: "updated_at",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(TABLE_NAME);
}

function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(TABLE_NAME, (table) => {
		table.increments(ColumnName.ID).primary();
		table.integer(ColumnName.PROJECT_ID).notNullable();
		table
			.integer(ColumnName.CREATED_BY_USER_ID)
			.notNullable()
			.references(ColumnName.ID)
			.inTable(USERS_TABLE_NAME)
			.onDelete("CASCADE");
		table
			.string(ColumnName.SOURCE_TYPE)
			.notNullable()
			.defaultTo(DocumentSourceType.MANUAL);
		table
			.string(ColumnName.TITLE, DocumentValidationRule.TITLE_MAXIMUM_LENGTH)
			.nullable();
		table.text(ColumnName.CONTENT).notNullable();
		table.string(ColumnName.CONTENT_HASH).notNullable();
		table
			.string(ColumnName.STATUS)
			.notNullable()
			.defaultTo(DocumentStatus.PROCESSING);
		table.text(ColumnName.ERROR_MESSAGE).nullable();
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table.index([
			ColumnName.CREATED_BY_USER_ID,
			ColumnName.PROJECT_ID,
			ColumnName.CONTENT_HASH,
			ColumnName.STATUS,
		]);
	});
}

export { down, up };
