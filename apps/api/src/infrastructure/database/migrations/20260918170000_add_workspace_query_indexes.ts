import { type Knex } from "knex";

const ColumnName = {
	PROJECT_ID: "project_id",
	UPDATED_AT: "updated_at",
	USER_ID: "user_id",
} as const;

const IndexName = {
	KNOWLEDGE_NODES_PROJECT_ID_UPDATED_AT:
		"knowledge_nodes_project_id_updated_at_index",
	PROJECT_MEMBERS_USER_ID_PROJECT_ID:
		"project_members_user_id_project_id_index",
} as const;

const TableName = {
	KNOWLEDGE_NODES: "knowledge_nodes",
	PROJECT_MEMBERS: "project_members",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.KNOWLEDGE_NODES, (table) => {
		table.dropIndex(
			[ColumnName.PROJECT_ID, ColumnName.UPDATED_AT],
			IndexName.KNOWLEDGE_NODES_PROJECT_ID_UPDATED_AT,
		);
	});

	await knex.schema.alterTable(TableName.PROJECT_MEMBERS, (table) => {
		table.dropIndex(
			[ColumnName.USER_ID, ColumnName.PROJECT_ID],
			IndexName.PROJECT_MEMBERS_USER_ID_PROJECT_ID,
		);
	});
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.KNOWLEDGE_NODES, (table) => {
		table.index(
			[ColumnName.PROJECT_ID, ColumnName.UPDATED_AT],
			IndexName.KNOWLEDGE_NODES_PROJECT_ID_UPDATED_AT,
		);
	});

	await knex.schema.alterTable(TableName.PROJECT_MEMBERS, (table) => {
		table.index(
			[ColumnName.USER_ID, ColumnName.PROJECT_ID],
			IndexName.PROJECT_MEMBERS_USER_ID_PROJECT_ID,
		);
	});
}

export { down, up };
