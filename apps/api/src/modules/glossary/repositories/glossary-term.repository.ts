import { type GlossaryRelatedTermDto } from "@knowledgeprism/types";
import { type EmbeddingVector } from "@knowledgeprism/worker";
import { type Transaction } from "objection";

import { DatabaseTableName } from "~/infrastructure/database/database.js";

import { GlossaryTermEntity } from "../models/glossary-term.entity.js";
import { type GlossaryTermModel } from "../models/glossary-term.model.js";

const EMPTY_LENGTH = 0;
const LOWERCASE_NAME_SQL = "lower(name)";
const RELATION_ALIAS = "relation";
const TERM_ALIAS = "term";

const escapeLikePattern = (query: string): string =>
	query
		.replaceAll("\\", String.raw`\\`)
		.replaceAll("%", String.raw`\%`)
		.replaceAll("_", String.raw`\_`);

const toEntity = (term: GlossaryTermModel): GlossaryTermEntity =>
	GlossaryTermEntity.initialize({
		createdAt: term.createdAt,
		definition: term.definition,
		embedding: term.embedding,
		id: term.id,
		name: term.name,
		projectId: term.projectId,
		updatedAt: term.updatedAt,
	});

class GlossaryTermRepository {
	private glossaryTermModel: typeof GlossaryTermModel;

	public constructor(glossaryTermModel: typeof GlossaryTermModel) {
		this.glossaryTermModel = glossaryTermModel;
	}

	public async backfillEmbedding({
		embedding,
		id,
	}: {
		embedding: EmbeddingVector;
		id: number;
	}): Promise<void> {
		await this.glossaryTermModel
			.query()
			.patch({ embedding })
			.where({ id })
			.whereNull("embedding")
			.execute();
	}

	public async countByIdsAndProjectId(
		{ ids, projectId }: { ids: number[]; projectId: number },
		transaction?: Transaction,
	): Promise<number> {
		if (ids.length === EMPTY_LENGTH) {
			return EMPTY_LENGTH;
		}

		return await this.glossaryTermModel
			.query(transaction)
			.where({ projectId })
			.whereIn("id", ids)
			.resultSize();
	}

	public async create(
		{ entity, userId }: { entity: GlossaryTermEntity; userId: number },
		transaction: Transaction,
	): Promise<GlossaryTermEntity> {
		const term = await this.glossaryTermModel
			.query(transaction)
			.insert({
				...entity.toNewObject(),
				createdBy: userId,
				updatedBy: userId,
			})
			.returning("*")
			.execute();

		return toEntity(term);
	}

	public async deleteByIdAndProjectId({
		id,
		projectId,
	}: {
		id: number;
		projectId: number;
	}): Promise<boolean> {
		const deletedCount = await this.glossaryTermModel
			.query()
			.delete()
			.where({ id, projectId })
			.execute();

		return deletedCount > EMPTY_LENGTH;
	}

	public async existsByName({
		excludedId,
		name,
		projectId,
	}: {
		excludedId: null | number;
		name: string;
		projectId: number;
	}): Promise<boolean> {
		const query = this.glossaryTermModel
			.query()
			.select("id")
			.where({ projectId })
			.whereRaw(`${LOWERCASE_NAME_SQL} = lower(?)`, [name]);

		if (excludedId !== null) {
			void query.whereNot("id", excludedId);
		}

		const term = await query.first().execute();

		return Boolean(term);
	}

	public async findAllByProjectId({
		projectId,
		query,
	}: {
		projectId: number;
		query: string;
	}): Promise<GlossaryTermEntity[]> {
		const builder = this.glossaryTermModel.query().where({ projectId });

		if (query.length > EMPTY_LENGTH) {
			void builder.where("name", "ilike", `%${escapeLikePattern(query)}%`);
		}

		const terms = await builder
			.orderByRaw(LOWERCASE_NAME_SQL)
			.orderBy("id", "asc")
			.execute();

		return terms.map((term) => toEntity(term));
	}

	public async findByIdAndProjectId(
		id: number,
		projectId: number,
		transaction?: Transaction,
	): Promise<GlossaryTermEntity | null> {
		const term = await this.glossaryTermModel
			.query(transaction)
			.findOne({ id, projectId })
			.execute();

		return term ? toEntity(term) : null;
	}

	public async findRelatedTerms(
		termId: number,
		transaction?: Transaction,
	): Promise<GlossaryRelatedTermDto[]> {
		return await this.glossaryTermModel
			.query(transaction)
			.alias(TERM_ALIAS)
			.select([`${TERM_ALIAS}.id`, `${TERM_ALIAS}.name`])
			.innerJoin(
				`${DatabaseTableName.GLOSSARY_TERM_RELATIONS} as ${RELATION_ALIAS}`,
				(join) => {
					join
						.on(`${RELATION_ALIAS}.termId`, `${TERM_ALIAS}.id`)
						.orOn(`${RELATION_ALIAS}.relatedTermId`, `${TERM_ALIAS}.id`);
				},
			)
			.where((builder) => {
				void builder
					.where(`${RELATION_ALIAS}.termId`, termId)
					.orWhere(`${RELATION_ALIAS}.relatedTermId`, termId);
			})
			.whereNot(`${TERM_ALIAS}.id`, termId)
			.orderByRaw(`lower(${TERM_ALIAS}.name)`)
			.orderBy(`${TERM_ALIAS}.id`, "asc")
			.castTo<GlossaryRelatedTermDto[]>()
			.execute();
	}

	public async update(
		{
			definition,
			embedding,
			id,
			name,
			updatedBy,
		}: {
			definition: string;
			embedding: EmbeddingVector;
			id: number;
			name: string;
			updatedBy: number;
		},
		transaction: Transaction,
	): Promise<GlossaryTermEntity> {
		const term = await this.glossaryTermModel
			.query(transaction)
			.patchAndFetchById(id, { definition, embedding, name, updatedBy })
			.execute();

		return toEntity(term);
	}
}

export { GlossaryTermRepository };
