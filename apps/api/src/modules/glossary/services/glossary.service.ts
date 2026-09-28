import { GlossaryValidationMessage, HTTPCode } from "@knowledgeprism/constants";
import {
	type GlossaryConsistencyCheckResponseDto,
	type GlossaryTermRequestDto,
	type GlossaryTermResponseDto,
	type GlossaryTermsResponseDto,
} from "@knowledgeprism/types";
import { checkGlossaryConsistency } from "@knowledgeprism/worker";
import {
	ForeignKeyViolationError,
	type Transaction,
	UniqueViolationError,
} from "objection";

import { type Database } from "~/infrastructure/database/database.js";
import { DatabaseConstraintName } from "~/infrastructure/database/libs/enums/database-constraint-name.enum.js";
import { HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { GlossaryTermEntity } from "../models/glossary-term.entity.js";
import { type GlossaryTermRelationRepository } from "../repositories/glossary-term-relation.repository.js";
import { type GlossaryTermRepository } from "../repositories/glossary-term.repository.js";

type Constructor = {
	database: Database;
	glossaryTermRelationRepository: GlossaryTermRelationRepository;
	glossaryTermRepository: GlossaryTermRepository;
	logger: Logger;
	projectService: ProjectService;
};

const EMPTY_QUERY = "";

class GlossaryService {
	private database: Database;

	private glossaryTermRelationRepository: GlossaryTermRelationRepository;

	private glossaryTermRepository: GlossaryTermRepository;

	private logger: Logger;

	private projectService: ProjectService;

	public constructor({
		database,
		glossaryTermRelationRepository,
		glossaryTermRepository,
		logger,
		projectService,
	}: Constructor) {
		this.database = database;
		this.glossaryTermRelationRepository = glossaryTermRelationRepository;
		this.glossaryTermRepository = glossaryTermRepository;
		this.logger = logger;
		this.projectService = projectService;
	}

	private async applyRelatedTerms(
		term: GlossaryTermEntity,
		relatedTermIds: number[],
		transaction: Transaction,
	): Promise<GlossaryTermResponseDto> {
		const { id, projectId } = term.toObject();

		await this.glossaryTermRelationRepository.replaceForTerm(
			{ projectId, relatedTermIds, termId: id },
			transaction,
		);

		return {
			...term.toObject(),
			relatedTerms: await this.glossaryTermRepository.findRelatedTerms(
				id,
				transaction,
			),
		};
	}

	private async assertNameAvailable(options: {
		excludedId: null | number;
		name: string;
		projectId: number;
	}): Promise<void> {
		const isTaken = await this.glossaryTermRepository.existsByName(options);

		if (isTaken) {
			throw new HTTPError({
				message: GlossaryValidationMessage.NAME_ALREADY_EXISTS,
				status: HTTPCode.CONFLICT,
			});
		}
	}

	private async assertRelatedTermsExist(
		{
			projectId,
			relatedTermIds,
			termId,
		}: { projectId: number; relatedTermIds: number[]; termId: null | number },
		transaction: Transaction,
	): Promise<void> {
		const existingCount =
			await this.glossaryTermRepository.countByIdsAndProjectId(
				{ ids: relatedTermIds, projectId },
				transaction,
			);

		if (
			(termId !== null && relatedTermIds.includes(termId)) ||
			existingCount !== relatedTermIds.length
		) {
			this.throwRelatedTermsInvalid();
		}
	}

	private async findTermOrThrow(
		id: number,
		projectId: number,
	): Promise<GlossaryTermEntity> {
		const term = await this.glossaryTermRepository.findByIdAndProjectId(
			id,
			projectId,
		);

		if (!term) {
			this.throwNotFound();
		}

		return term;
	}

	private normalize({
		definition,
		name,
		relatedTermIds,
	}: GlossaryTermRequestDto): GlossaryTermRequestDto {
		return {
			definition: definition.trim(),
			name: name.trim(),
			relatedTermIds: [...new Set(relatedTermIds)],
		};
	}

	private async saveWithUniqueName(
		save: () => Promise<GlossaryTermResponseDto>,
	): Promise<GlossaryTermResponseDto> {
		try {
			return await save();
		} catch (error) {
			if (
				error instanceof UniqueViolationError &&
				error.constraint ===
					DatabaseConstraintName.GLOSSARY_TERMS_PROJECT_ID_LOWER_NAME_UNIQUE
			) {
				throw new HTTPError({
					cause: error,
					message: GlossaryValidationMessage.NAME_ALREADY_EXISTS,
					status: HTTPCode.CONFLICT,
				});
			}

			if (error instanceof ForeignKeyViolationError) {
				this.throwRelatedTermsInvalid(error);
			}

			throw error;
		}
	}

	private throwNotFound(): never {
		throw new HTTPError({
			message: GlossaryValidationMessage.NOT_FOUND,
			status: HTTPCode.NOT_FOUND,
		});
	}

	private throwRelatedTermsInvalid(cause?: unknown): never {
		throw new HTTPError({
			cause,
			message: GlossaryValidationMessage.RELATED_TERMS_INVALID,
			status: HTTPCode.UNPROCESSED_ENTITY,
		});
	}

	public async checkConsistency({
		content,
		context,
		projectId,
	}: {
		content: string;
		context: ProjectAccessContext;
		projectId: number;
	}): Promise<GlossaryConsistencyCheckResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const terms = await this.glossaryTermRepository.findAllByProjectId({
			projectId,
			query: EMPTY_QUERY,
		});

		const matches = await checkGlossaryConsistency({
			content,
			terms: terms.map((term) => {
				const { definition, id, name } = term.toObject();

				return { definition, id, name };
			}),
		});

		return { matches };
	}

	public async create({
		context,
		payload,
		projectId,
	}: {
		context: ProjectAccessContext;
		payload: GlossaryTermRequestDto;
		projectId: number;
	}): Promise<GlossaryTermResponseDto> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const { definition, name, relatedTermIds } = this.normalize(payload);

		await this.assertNameAvailable({ excludedId: null, name, projectId });

		const term = await this.saveWithUniqueName(() =>
			this.database.transaction(async (transaction) => {
				await this.assertRelatedTermsExist(
					{ projectId, relatedTermIds, termId: null },
					transaction,
				);

				const createdTerm = await this.glossaryTermRepository.create(
					{
						entity: GlossaryTermEntity.initializeNew({
							definition,
							name,
							projectId,
						}),
						userId: context.userId,
					},
					transaction,
				);

				return await this.applyRelatedTerms(
					createdTerm,
					relatedTermIds,
					transaction,
				);
			}),
		);

		this.logger.info(
			`User ${String(context.userId)} created glossary term ${String(term.id)}`,
		);

		return term;
	}

	public async delete({
		context,
		id,
		projectId,
	}: {
		context: ProjectAccessContext;
		id: number;
		projectId: number;
	}): Promise<void> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const isDeleted = await this.glossaryTermRepository.deleteByIdAndProjectId({
			id,
			projectId,
		});

		if (!isDeleted) {
			this.throwNotFound();
		}

		this.logger.info(
			`User ${String(context.userId)} deleted glossary term ${String(id)}`,
		);
	}

	public async find({
		context,
		id,
		projectId,
	}: {
		context: ProjectAccessContext;
		id: number;
		projectId: number;
	}): Promise<GlossaryTermResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const term = await this.findTermOrThrow(id, projectId);

		return {
			...term.toObject(),
			relatedTerms: await this.glossaryTermRepository.findRelatedTerms(id),
		};
	}

	public async findAll({
		context,
		projectId,
		query,
	}: {
		context: ProjectAccessContext;
		projectId: number;
		query: string | undefined;
	}): Promise<GlossaryTermsResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const terms = await this.glossaryTermRepository.findAllByProjectId({
			projectId,
			query: query?.trim() ?? EMPTY_QUERY,
		});

		return {
			items: terms.map((term) => {
				const { definition, id, name } = term.toObject();

				return { definition, id, name };
			}),
		};
	}

	public async update({
		context,
		id,
		payload,
		projectId,
	}: {
		context: ProjectAccessContext;
		id: number;
		payload: GlossaryTermRequestDto;
		projectId: number;
	}): Promise<GlossaryTermResponseDto> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);
		await this.findTermOrThrow(id, projectId);

		const { definition, name, relatedTermIds } = this.normalize(payload);

		await this.assertNameAvailable({ excludedId: id, name, projectId });

		const term = await this.saveWithUniqueName(() =>
			this.database.transaction(async (transaction) => {
				await this.assertRelatedTermsExist(
					{ projectId, relatedTermIds, termId: id },
					transaction,
				);

				const updatedTerm = await this.glossaryTermRepository.update(
					{ definition, id, name, updatedBy: context.userId },
					transaction,
				);

				return await this.applyRelatedTerms(
					updatedTerm,
					relatedTermIds,
					transaction,
				);
			}),
		);

		this.logger.info(
			`User ${String(context.userId)} updated glossary term ${String(id)}`,
		);

		return term;
	}
}

export { GlossaryService };
