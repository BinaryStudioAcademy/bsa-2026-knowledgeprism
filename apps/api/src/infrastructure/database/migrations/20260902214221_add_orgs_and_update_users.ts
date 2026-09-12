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
	await knex(TableName.USERS)
		.whereNull(ColumnName.FIRST_NAME)
		.update({ [ColumnName.FIRST_NAME]: "" });
	await knex(TableName.USERS)
		.whereNull(ColumnName.LAST_NAME)
		.update({ [ColumnName.LAST_NAME]: "" });
	await knex(TableName.USERS).whereNull(ColumnName.ORGANISATION_ID).delete();

	await knex.schema.alterTable(TableName.USERS, (table) => {
		table.dropColumn(ColumnName.STATUS);
		table.string(ColumnName.FIRST_NAME).notNullable().alter();
		table.string(ColumnName.LAST_NAME).notNullable().alter();
		table.integer(ColumnName.ORGANISATION_ID).notNullable().alter();
	});

	await knex.schema.dropTableIfExists(TableName.PROJECT_MEMBERS);
	await knex.schema.dropTableIfExists(TableName.PROJECTS);
}

async function up(knex: Knex): Promise<void> {
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
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
	});

	await knex.schema.alterTable(TableName.USERS, (table) => {
		table.integer(ColumnName.ORGANISATION_ID).nullable().alter();
		table.string(ColumnName.FIRST_NAME).nullable().alter();
		table.string(ColumnName.LAST_NAME).nullable().alter();
		table
			.enum(ColumnName.STATUS, ["active", "inactive"])
			.notNullable()
			.defaultTo("active");
	});
}

export { down, up };
