import { type Knex } from "knex";

const TABLE_NAME = "sessions";

const ColumnName = {
	CREATED_AT: "created_at",
	DATA: "data",
	EXPIRES_AT: "expires_at",
	ID: "id",
	UPDATED_AT: "updated_at",
	USER_ID: "user_id",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.dropTableIfExists(TABLE_NAME);
}

function up(knex: Knex): Promise<void> {
	return knex.schema.createTable(TABLE_NAME, (table) => {
		table.string(ColumnName.ID).primary();
		table
			.integer(ColumnName.USER_ID)
			.unsigned()
			.nullable()
			.references("id")
			.inTable("users")
			.onDelete("SET NULL");
		table.jsonb(ColumnName.DATA).notNullable();
		table.dateTime(ColumnName.EXPIRES_AT).notNullable();
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
