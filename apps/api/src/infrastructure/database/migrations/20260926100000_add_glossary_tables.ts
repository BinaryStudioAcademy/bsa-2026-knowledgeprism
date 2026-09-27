import { GlossaryValidationRule } from "@knowledgeprism/constants";
import { type Knex } from "knex";

const TableName = {
	GLOSSARY_TERM_RELATIONS: "glossary_term_relations",
	GLOSSARY_TERMS: "glossary_terms",
	PROJECTS: "projects",
	USERS: "users",
} as const;

const ColumnName = {
	CREATED_AT: "created_at",
	CREATED_BY: "created_by",
	DEFINITION: "definition",
	ID: "id",
	NAME: "name",
	PROJECT_ID: "project_id",
	RELATED_TERM_ID: "related_term_id",
	TERM_ID: "term_id",
	UPDATED_AT: "updated_at",
	UPDATED_BY: "updated_by",
} as const;

const ConstraintName = {
	GLOSSARY_TERM_RELATIONS_ORDERED_PAIR_CHECK:
		"glossary_term_relations_ordered_pair_check",
	GLOSSARY_TERM_RELATIONS_RELATED_TERM_ID_INDEX:
		"glossary_term_relations_related_term_id_index",
	GLOSSARY_TERM_RELATIONS_RELATED_TERM_ID_PROJECT_ID_FOREIGN:
		"glossary_term_relations_related_term_id_project_id_foreign",
	GLOSSARY_TERM_RELATIONS_TERM_ID_PROJECT_ID_FOREIGN:
		"glossary_term_relations_term_id_project_id_foreign",
	GLOSSARY_TERM_RELATIONS_TERM_ID_RELATED_TERM_ID_UNIQUE:
		"glossary_term_relations_term_id_related_term_id_unique",
	GLOSSARY_TERMS_ID_PROJECT_ID_UNIQUE: "glossary_terms_id_project_id_unique",
	GLOSSARY_TERMS_PROJECT_ID_LOWER_NAME_UNIQUE:
		"glossary_terms_project_id_lower_name_unique",
} as const;

async function down(knex: Knex): Promise<void> {
	await knex.schema.dropTableIfExists(TableName.GLOSSARY_TERM_RELATIONS);
	await knex.schema.dropTableIfExists(TableName.GLOSSARY_TERMS);
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(TableName.GLOSSARY_TERMS, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.PROJECT_ID)
			.references(ColumnName.ID)
			.inTable(TableName.PROJECTS)
			.notNullable()
			.onDelete("CASCADE");
		table
			.string(ColumnName.NAME, GlossaryValidationRule.NAME_MAXIMUM_LENGTH)
			.notNullable();
		table
			.string(
				ColumnName.DEFINITION,
				GlossaryValidationRule.DEFINITION_MAXIMUM_LENGTH,
			)
			.notNullable();
		table
			.integer(ColumnName.CREATED_BY)
			.references(ColumnName.ID)
			.inTable(TableName.USERS)
			.nullable()
			.onDelete("SET NULL");
		table
			.integer(ColumnName.UPDATED_BY)
			.references(ColumnName.ID)
			.inTable(TableName.USERS)
			.nullable()
			.onDelete("SET NULL");
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table.unique([ColumnName.ID, ColumnName.PROJECT_ID], {
			indexName: ConstraintName.GLOSSARY_TERMS_ID_PROJECT_ID_UNIQUE,
		});
	});

	await knex.raw("CREATE UNIQUE INDEX ?? ON ?? (??, lower(??))", [
		ConstraintName.GLOSSARY_TERMS_PROJECT_ID_LOWER_NAME_UNIQUE,
		TableName.GLOSSARY_TERMS,
		ColumnName.PROJECT_ID,
		ColumnName.NAME,
	]);

	await knex.schema.createTable(TableName.GLOSSARY_TERM_RELATIONS, (table) => {
		table.increments(ColumnName.ID).primary();
		table.integer(ColumnName.PROJECT_ID).notNullable();
		table.integer(ColumnName.TERM_ID).notNullable();
		table
			.integer(ColumnName.RELATED_TERM_ID)
			.notNullable()
			.index(ConstraintName.GLOSSARY_TERM_RELATIONS_RELATED_TERM_ID_INDEX);
		table
			.dateTime(ColumnName.CREATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.dateTime(ColumnName.UPDATED_AT)
			.notNullable()
			.defaultTo(knex.fn.now());
		table
			.foreign(
				[ColumnName.TERM_ID, ColumnName.PROJECT_ID],
				ConstraintName.GLOSSARY_TERM_RELATIONS_TERM_ID_PROJECT_ID_FOREIGN,
			)
			.references([ColumnName.ID, ColumnName.PROJECT_ID])
			.inTable(TableName.GLOSSARY_TERMS)
			.onDelete("CASCADE");
		table
			.foreign(
				[ColumnName.RELATED_TERM_ID, ColumnName.PROJECT_ID],
				ConstraintName.GLOSSARY_TERM_RELATIONS_RELATED_TERM_ID_PROJECT_ID_FOREIGN,
			)
			.references([ColumnName.ID, ColumnName.PROJECT_ID])
			.inTable(TableName.GLOSSARY_TERMS)
			.onDelete("CASCADE");
		table.unique([ColumnName.TERM_ID, ColumnName.RELATED_TERM_ID], {
			indexName:
				ConstraintName.GLOSSARY_TERM_RELATIONS_TERM_ID_RELATED_TERM_ID_UNIQUE,
		});
		table.check(
			"?? < ??",
			[ColumnName.TERM_ID, ColumnName.RELATED_TERM_ID],
			ConstraintName.GLOSSARY_TERM_RELATIONS_ORDERED_PAIR_CHECK,
		);
	});
}

export { down, up };
