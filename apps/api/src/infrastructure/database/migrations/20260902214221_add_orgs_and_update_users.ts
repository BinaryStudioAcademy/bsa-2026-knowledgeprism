import { type Knex } from "knex";

const TableName = {
	ORGANISATIONS: "organisations",
	PROJECT_MEMBERS: "project_members",
	PROJECTS: "projects",
	USERS: "users",
} as const;

const ColumnName = {
	CREATED_AT: "created_at",
	DESCRIPTION: "description",
	FIRST_NAME: "first_name",
	ID: "id",
	LAST_NAME: "last_name",
	NAME: "name",
	ORGANISATION_ID: "organisation_id",
	PROJECT_ID: "project_id",
	ROLE: "role",
	STATUS: "status",
	UPDATED_AT: "updated_at",
	USER_ID: "user_id",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.USERS, (table) => {
		table.dropForeign(ColumnName.ORGANISATION_ID);
		table.dropColumn(ColumnName.ORGANISATION_ID);
		table.dropColumn(ColumnName.FIRST_NAME);
		table.dropColumn(ColumnName.LAST_NAME);
		table.dropColumn(ColumnName.STATUS);
	});

	await knex.schema.dropTableIfExists(TableName.PROJECT_MEMBERS);
	await knex.schema.dropTableIfExists(TableName.PROJECTS);
	await knex.schema.dropTableIfExists(TableName.ORGANISATIONS);
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(TableName.ORGANISATIONS, (table) => {
		table.increments(ColumnName.ID).primary();
		table.string(ColumnName.NAME).notNullable();
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
	});

	await knex.schema.createTable(TableName.PROJECTS, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.ORGANISATION_ID)
			.references(ColumnName.ID)
			.inTable(TableName.ORGANISATIONS)
			.notNullable()
			.onDelete("CASCADE");
		table.string(ColumnName.NAME).notNullable();
		table.text(ColumnName.DESCRIPTION).nullable();
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
	});

	await knex.schema.createTable(TableName.PROJECT_MEMBERS, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.PROJECT_ID)
			.references(ColumnName.ID)
			.inTable(TableName.PROJECTS)
			.notNullable()
			.onDelete("CASCADE");
		table
			.integer(ColumnName.USER_ID)
			.references(ColumnName.ID)
			.inTable(TableName.USERS)
			.notNullable()
			.onDelete("CASCADE");
		table.enum(ColumnName.ROLE, ["ADMIN", "EDITOR", "VIEWER"]).notNullable();
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
	});

	await knex.schema.alterTable(TableName.USERS, (table) => {
		table
			.integer(ColumnName.ORGANISATION_ID)
			.references(ColumnName.ID)
			.inTable(TableName.ORGANISATIONS)
			.nullable()
			.onDelete("CASCADE");
		table.string(ColumnName.FIRST_NAME).nullable();
		table.string(ColumnName.LAST_NAME).nullable();
		table
			.enum(ColumnName.STATUS, ["active", "inactive"])
			.notNullable()
			.defaultTo("active");
	});
}

export { down, up };
