import { type Knex } from "knex";

const ColumnName = {
	ID: "id",
	STATUS: "status",
	USER_ID: "user_id",
} as const;

const TableName = {
	SESSIONS: "sessions",
	USERS: "users",
} as const;

const INACTIVE_STATUS = "inactive";

function down(): Promise<void> {
	return Promise.resolve();
}

async function up(knex: Knex): Promise<void> {
	await knex(TableName.SESSIONS)
		.whereIn(
			ColumnName.USER_ID,
			knex(TableName.USERS)
				.select(ColumnName.ID)
				.where(ColumnName.STATUS, INACTIVE_STATUS),
		)
		.del();
}

export { down, up };
