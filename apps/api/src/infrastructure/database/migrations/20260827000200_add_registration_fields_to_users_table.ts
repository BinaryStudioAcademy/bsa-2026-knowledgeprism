import { type Knex } from "knex";

const ORGANISATIONS_TABLE_NAME = "organisations";
const USERS_TABLE_NAME = "users";

const ColumnName = {
	FIRST_NAME: "first_name",
	LAST_NAME: "last_name",
	ORGANISATION_ID: "organisation_id",
} as const;

function down(knex: Knex): Promise<void> {
	return knex.schema.table(USERS_TABLE_NAME, (table) => {
		table.dropColumn(ColumnName.LAST_NAME);
		table.dropColumn(ColumnName.FIRST_NAME);
		table.dropColumn(ColumnName.ORGANISATION_ID);
	});
}

function up(knex: Knex): Promise<void> {
	return knex.schema.table(USERS_TABLE_NAME, (table) => {
		table
			.integer(ColumnName.ORGANISATION_ID)
			.unsigned()
			.notNullable()
			.references("id")
			.inTable(ORGANISATIONS_TABLE_NAME)
			.onDelete("CASCADE");
		table.string(ColumnName.FIRST_NAME).notNullable();
		table.string(ColumnName.LAST_NAME).notNullable();
	});
}

export { down, up };
