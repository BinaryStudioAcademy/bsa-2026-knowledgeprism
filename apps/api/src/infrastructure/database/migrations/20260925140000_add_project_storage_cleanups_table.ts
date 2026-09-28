import { type Knex } from "knex";

const TABLE_NAME = "project_storage_cleanups";

const ProjectStorageCleanupStatus = {
	COMPLETED: "COMPLETED",
	FAILED: "FAILED",
	PENDING: "PENDING",
	PROCESSING: "PROCESSING",
} as const;

const DEFAULT_ATTEMPTS_COUNT = 0;

const ColumnName = {
	ATTEMPTS: "attempts",
	CREATED_AT: "created_at",
	ERROR_MESSAGE: "error_message",
	EXECUTE_AFTER: "execute_after",
	ID: "id",
	PREFIX: "prefix",
	PROJECT_ID: "project_id",
	STATUS: "status",
	UPDATED_AT: "updated_at",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(TABLE_NAME);
}

function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(TABLE_NAME, (table) => {
		table.increments(ColumnName.ID).primary();
		table.integer(ColumnName.PROJECT_ID).notNullable().index();
		table.string(ColumnName.PREFIX).notNullable();
		table
			.enum(ColumnName.STATUS, Object.values(ProjectStorageCleanupStatus))
			.notNullable()
			.defaultTo(ProjectStorageCleanupStatus.PENDING)
			.index();
		table
			.dateTime(ColumnName.EXECUTE_AFTER)
			.notNullable()
			.defaultTo(knex.fn.now())
			.index();
		table
			.integer(ColumnName.ATTEMPTS)
			.notNullable()
			.defaultTo(DEFAULT_ATTEMPTS_COUNT);
		table.text(ColumnName.ERROR_MESSAGE).nullable();
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
