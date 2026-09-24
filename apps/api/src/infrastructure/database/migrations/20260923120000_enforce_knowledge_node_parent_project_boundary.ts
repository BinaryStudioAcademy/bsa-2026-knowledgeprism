import { type Knex } from "knex";

const ColumnName = {
	ID: "id",
	PARENT_ID: "parent_id",
	PROJECT_ID: "project_id",
} as const;

const ConstraintName = {
	KNOWLEDGE_NODES_ID_PROJECT_ID_UNIQUE: "knowledge_nodes_id_project_id_unique",
	KNOWLEDGE_NODES_PARENT_ID_FOREIGN: "knowledge_nodes_parent_id_foreign",
	KNOWLEDGE_NODES_PARENT_ID_PROJECT_ID_FOREIGN:
		"knowledge_nodes_parent_id_project_id_foreign",
} as const;

const INVALID_PARENT_REFERENCE_ERROR =
	"Knowledge nodes have parent references from another project. Reconcile them before retrying this migration.";

const TableAlias = {
	CHILD: "child",
	PARENT: "parent",
} as const;

const TableName = {
	KNOWLEDGE_NODES: "knowledge_nodes",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.KNOWLEDGE_NODES, (table) => {
		table.dropForeign(
			[ColumnName.PARENT_ID, ColumnName.PROJECT_ID],
			ConstraintName.KNOWLEDGE_NODES_PARENT_ID_PROJECT_ID_FOREIGN,
		);
	});

	await knex.schema.alterTable(TableName.KNOWLEDGE_NODES, (table) => {
		table.dropUnique(
			[ColumnName.ID, ColumnName.PROJECT_ID],
			ConstraintName.KNOWLEDGE_NODES_ID_PROJECT_ID_UNIQUE,
		);
	});

	await knex.schema.alterTable(TableName.KNOWLEDGE_NODES, (table) => {
		table
			.foreign(
				ColumnName.PARENT_ID,
				ConstraintName.KNOWLEDGE_NODES_PARENT_ID_FOREIGN,
			)
			.references(ColumnName.ID)
			.inTable(TableName.KNOWLEDGE_NODES)
			.onDelete("CASCADE");
	});
}

async function up(knex: Knex): Promise<void> {
	const invalidNode = await knex(
		`${TableName.KNOWLEDGE_NODES} as ${TableAlias.CHILD}`,
	)
		.innerJoin(
			`${TableName.KNOWLEDGE_NODES} as ${TableAlias.PARENT}`,
			`${TableAlias.CHILD}.${ColumnName.PARENT_ID}`,
			`${TableAlias.PARENT}.${ColumnName.ID}`,
		)
		.whereNot(
			`${TableAlias.CHILD}.${ColumnName.PROJECT_ID}`,
			knex.ref(`${TableAlias.PARENT}.${ColumnName.PROJECT_ID}`),
		)
		.select(`${TableAlias.CHILD}.${ColumnName.ID}`)
		.first<undefined | { id: number }>();

	if (invalidNode) {
		throw new Error(INVALID_PARENT_REFERENCE_ERROR);
	}

	await knex.schema.alterTable(TableName.KNOWLEDGE_NODES, (table) => {
		table.dropForeign(
			[ColumnName.PARENT_ID],
			ConstraintName.KNOWLEDGE_NODES_PARENT_ID_FOREIGN,
		);
	});

	await knex.schema.alterTable(TableName.KNOWLEDGE_NODES, (table) => {
		table.unique([ColumnName.ID, ColumnName.PROJECT_ID], {
			indexName: ConstraintName.KNOWLEDGE_NODES_ID_PROJECT_ID_UNIQUE,
		});
	});

	await knex.schema.alterTable(TableName.KNOWLEDGE_NODES, (table) => {
		table
			.foreign(
				[ColumnName.PARENT_ID, ColumnName.PROJECT_ID],
				ConstraintName.KNOWLEDGE_NODES_PARENT_ID_PROJECT_ID_FOREIGN,
			)
			.references([ColumnName.ID, ColumnName.PROJECT_ID])
			.inTable(TableName.KNOWLEDGE_NODES)
			.onDelete("CASCADE");
	});
}

export { down, up };
