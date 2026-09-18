import { type Knex } from "knex";

const ColumnName = {
	ID: "id",
	ORGANISATION_ID: "organisation_id",
	ORGANISATION_ROLE: "organisation_role",
	PROJECT_ID: "project_id",
	USER_ID: "user_id",
} as const;

const IndexName = {
	PROJECT_MEMBERS_PROJECT_ID_USER_ID_UNIQUE:
		"project_members_project_id_user_id_unique",
	PROJECTS_ORGANISATION_ID_INDEX: "projects_organisation_id_index",
} as const;

const OrganisationRole = {
	ADMIN: "ADMIN",
	USER: "USER",
} as const;

const TableName = {
	PROJECT_MEMBERS: "project_members",
	PROJECTS: "projects",
	USERS: "users",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.PROJECT_MEMBERS, (table) => {
		table.dropUnique(
			[ColumnName.PROJECT_ID, ColumnName.USER_ID],
			IndexName.PROJECT_MEMBERS_PROJECT_ID_USER_ID_UNIQUE,
		);
	});

	await knex.schema.alterTable(TableName.PROJECTS, (table) => {
		table.dropIndex(
			ColumnName.ORGANISATION_ID,
			IndexName.PROJECTS_ORGANISATION_ID_INDEX,
		);
	});

	await knex.schema.alterTable(TableName.USERS, (table) => {
		table.dropColumn(ColumnName.ORGANISATION_ROLE);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.USERS, (table) => {
		table
			.enum(ColumnName.ORGANISATION_ROLE, [
				OrganisationRole.ADMIN,
				OrganisationRole.USER,
			])
			.nullable();
	});

	await knex(TableName.USERS)
		.whereNull(ColumnName.ORGANISATION_ROLE)
		.update({
			[ColumnName.ORGANISATION_ROLE]: OrganisationRole.USER,
		});

	const organisationAdminIds = knex(TableName.USERS)
		.min(ColumnName.ID)
		.whereNotNull(ColumnName.ORGANISATION_ID)
		.groupBy(ColumnName.ORGANISATION_ID);

	await knex(TableName.USERS)
		.whereIn(ColumnName.ID, organisationAdminIds)
		.update({
			[ColumnName.ORGANISATION_ROLE]: OrganisationRole.ADMIN,
		});

	await knex.schema.alterTable(TableName.PROJECTS, (table) => {
		table.index(
			ColumnName.ORGANISATION_ID,
			IndexName.PROJECTS_ORGANISATION_ID_INDEX,
		);
	});

	await knex.schema.alterTable(TableName.PROJECT_MEMBERS, (table) => {
		table.unique([ColumnName.PROJECT_ID, ColumnName.USER_ID], {
			indexName: IndexName.PROJECT_MEMBERS_PROJECT_ID_USER_ID_UNIQUE,
		});
	});
}

export { down, up };
