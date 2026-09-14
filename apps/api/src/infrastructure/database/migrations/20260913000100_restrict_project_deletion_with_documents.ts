import { type Knex } from "knex";

async function down(knex: Knex): Promise<void> {
	await knex.raw(`
		ALTER TABLE documents
			DROP CONSTRAINT documents_project_id_foreign;

		ALTER TABLE documents
			ALTER COLUMN project_id TYPE varchar(255)
			USING project_id::text;
	`);
}

async function up(knex: Knex): Promise<void> {
	await knex.raw(`
		LOCK TABLE projects, documents IN ACCESS EXCLUSIVE MODE;

		DO $migration$
		BEGIN
			IF EXISTS (
				SELECT 1
				FROM documents AS document
				LEFT JOIN projects AS project
					ON document.project_id = project.id::text
				WHERE project.id IS NULL
			) THEN
				RAISE EXCEPTION
					'Documents have invalid or missing project references. Reconcile them before retrying this migration.';
			END IF;
		END;
		$migration$;

		ALTER TABLE documents
			ALTER COLUMN project_id TYPE integer
			USING project_id::integer;

		ALTER TABLE documents
			ADD CONSTRAINT documents_project_id_foreign
			FOREIGN KEY (project_id)
			REFERENCES projects(id)
			ON DELETE NO ACTION;
	`);
}

export { down, up };
