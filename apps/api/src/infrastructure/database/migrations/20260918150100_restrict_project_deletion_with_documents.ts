import { type Knex } from "knex";

const ColumnName = {
	ID: "id",
	PROJECT_ID: "project_id",
} as const;

const ConstraintName = {
	DOCUMENTS_PROJECT_ID_FOREIGN: "documents_project_id_foreign",
} as const;

const INVALID_PROJECT_REFERENCE_ERROR =
	"Documents have invalid or missing project references. Reconcile them before retrying this migration.";

const TableAlias = {
	DOCUMENT: "document",
	PROJECT: "project",
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
		table.string(ColumnName.PROJECT_ID).notNullable().alter();
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.raw("LOCK TABLE ??, ?? IN ACCESS EXCLUSIVE MODE", [
		TableName.PROJECTS,
		TableName.DOCUMENTS,
	]);

	const invalidDocument = await knex(
		`${TableName.DOCUMENTS} as ${TableAlias.DOCUMENT}`,
	)
		.leftJoin(
			`${TableName.PROJECTS} as ${TableAlias.PROJECT}`,
			`${TableAlias.DOCUMENT}.${ColumnName.PROJECT_ID}`,
			knex.raw("??::text", [`${TableAlias.PROJECT}.${ColumnName.ID}`]),
		)
		.whereNull(`${TableAlias.PROJECT}.${ColumnName.ID}`)
		.select(`${TableAlias.DOCUMENT}.${ColumnName.ID}`)
		.first<undefined | { id: number }>();

	if (invalidDocument) {
		throw new Error(INVALID_PROJECT_REFERENCE_ERROR);
	}

	await knex.schema.alterTable(TableName.DOCUMENTS, (table) => {
		table.integer(ColumnName.PROJECT_ID).notNullable().alter();
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

export { down, up };
