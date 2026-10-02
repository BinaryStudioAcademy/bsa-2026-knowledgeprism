import { type Knex } from "knex";

const TableName = {
	DOCUMENT_CHUNKS: "document_chunks",
	DOCUMENTS: "documents",
	EXTRACTION_ITEMS: "extraction_items",
	EXTRACTION_RESPONSES: "extraction_responses",
	EXTRACTION_RUNS: "extraction_runs",
} as const;

const ColumnName = {
	ATTEMPT: "attempt",
	CHUNK_COUNT: "chunk_count",
	CONTENT: "content",
	CREATED_AT: "created_at",
	DOCUMENT_CHUNK_ID: "document_chunk_id",
	DOCUMENT_ID: "document_id",
	ERROR_REASON: "error_reason",
	EXTRACTION_RUN_ID: "extraction_run_id",
	ID: "id",
	PAGE_END: "page_end",
	PAGE_START: "page_start",
	POSITION: "position",
	PROCESSING_ATTEMPT: "processing_attempt",
	RAW_RESPONSE: "raw_response",
	SECTION_TITLE: "section_title",
	SPLIT_PART: "split_part",
	STATUS: "status",
	TRANSLATED_CONTENT: "translated_content",
	UPDATED_AT: "updated_at",
} as const;

const ExtractionRunStatus = {
	CANCELLED: "CANCELLED",
	COMPLETED: "COMPLETED",
	FAILED: "FAILED",
	RUNNING: "RUNNING",
} as const;

const ERROR_REASON_MAXIMUM_LENGTH = 64;
const SECTION_TITLE_MAXIMUM_LENGTH = 255;
const NO_CHUNKS = 0;

const addTimestamps = (knex: Knex, table: Knex.CreateTableBuilder): void => {
	table.dateTime(ColumnName.CREATED_AT).notNullable().defaultTo(knex.fn.now());
	table.dateTime(ColumnName.UPDATED_AT).notNullable().defaultTo(knex.fn.now());
};

async function down(knex: Knex): Promise<void> {
	await knex.schema.alterTable(TableName.EXTRACTION_ITEMS, (table) => {
		table.dropColumn(ColumnName.EXTRACTION_RUN_ID);
	});
	await knex.schema.dropTable(TableName.EXTRACTION_RESPONSES);
	await knex.schema.dropTable(TableName.DOCUMENT_CHUNKS);
	await knex.schema.dropTable(TableName.EXTRACTION_RUNS);
}

async function up(knex: Knex): Promise<void> {
	await knex.schema.createTable(TableName.EXTRACTION_RUNS, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.DOCUMENT_ID)
			.notNullable()
			.references(ColumnName.ID)
			.inTable(TableName.DOCUMENTS)
			.onDelete("CASCADE")
			.index();
		table.integer(ColumnName.PROCESSING_ATTEMPT).notNullable();
		table
			.enum(ColumnName.STATUS, Object.values(ExtractionRunStatus))
			.notNullable()
			.defaultTo(ExtractionRunStatus.RUNNING);
		table.integer(ColumnName.CHUNK_COUNT).notNullable().defaultTo(NO_CHUNKS);
		addTimestamps(knex, table);
	});

	await knex.schema.createTable(TableName.DOCUMENT_CHUNKS, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.EXTRACTION_RUN_ID)
			.notNullable()
			.references(ColumnName.ID)
			.inTable(TableName.EXTRACTION_RUNS)
			.onDelete("CASCADE")
			.index();
		table.integer(ColumnName.POSITION).notNullable();
		table
			.string(ColumnName.SECTION_TITLE, SECTION_TITLE_MAXIMUM_LENGTH)
			.nullable();
		table.integer(ColumnName.PAGE_START).notNullable();
		table.integer(ColumnName.PAGE_END).notNullable();
		table.text(ColumnName.CONTENT).notNullable();
		table.text(ColumnName.TRANSLATED_CONTENT).nullable();
		addTimestamps(knex, table);
		table.unique([ColumnName.EXTRACTION_RUN_ID, ColumnName.POSITION]);
	});

	await knex.schema.createTable(TableName.EXTRACTION_RESPONSES, (table) => {
		table.increments(ColumnName.ID).primary();
		table
			.integer(ColumnName.DOCUMENT_CHUNK_ID)
			.notNullable()
			.references(ColumnName.ID)
			.inTable(TableName.DOCUMENT_CHUNKS)
			.onDelete("CASCADE")
			.index();
		table.integer(ColumnName.ATTEMPT).notNullable();
		table.integer(ColumnName.SPLIT_PART).nullable();
		table.text(ColumnName.RAW_RESPONSE).nullable();
		table
			.string(ColumnName.ERROR_REASON, ERROR_REASON_MAXIMUM_LENGTH)
			.nullable();
		addTimestamps(knex, table);
	});

	await knex.schema.alterTable(TableName.EXTRACTION_ITEMS, (table) => {
		table
			.integer(ColumnName.EXTRACTION_RUN_ID)
			.nullable()
			.references(ColumnName.ID)
			.inTable(TableName.EXTRACTION_RUNS)
			.onDelete("SET NULL")
			.index();
	});
}

export { down, up };
