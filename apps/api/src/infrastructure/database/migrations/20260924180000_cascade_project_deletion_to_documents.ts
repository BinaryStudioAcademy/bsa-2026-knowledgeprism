import { type Knex } from "knex";

const ColumnName = {
	ID: "id",
	PROJECT_ID: "project_id",
} as const;

const ConstraintName = {
	DOCUMENTS_PROJECT_ID_FOREIGN: "documents_project_id_foreign",
} as const;

const TableName = {
	DOCUMENTS: "documents",
	PROJECTS: "projects",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.DOCUMENTS, (table) => {
		table.dropForeign(
			[ColumnName.PROJECT_ID],
			ConstraintName.DOCUMENTS_PROJECT_ID_FOREIGN,
		);
	});

	await knex.schema.alterTable(TableName.DOCUMENTS, (table) => {
		table
			.foreign(
				ColumnName.PROJECT_ID,
				ConstraintName.DOCUMENTS_PROJECT_ID_FOREIGN,
			)
			.references(ColumnName.ID)
			.inTable(TableName.PROJECTS)
			.onDelete("NO ACTION");
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.DOCUMENTS, (table) => {
		table.dropForeign(
			[ColumnName.PROJECT_ID],
			ConstraintName.DOCUMENTS_PROJECT_ID_FOREIGN,
		);
	});

	await knex.schema.alterTable(TableName.DOCUMENTS, (table) => {
		table
			.foreign(
				ColumnName.PROJECT_ID,
				ConstraintName.DOCUMENTS_PROJECT_ID_FOREIGN,
			)
			.references(ColumnName.ID)
			.inTable(TableName.PROJECTS)
			.onDelete("CASCADE");
	});
}

export { down, up };
