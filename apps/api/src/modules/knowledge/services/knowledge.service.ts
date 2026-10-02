import {
	HTTPCode,
	KnowledgeNodeType,
	KnowledgeValidationMessage,
} from "@knowledgeprism/constants";
import {
	type KnowledgeDocumentCreateRequestDto,
	type KnowledgeDocumentMoveRequestDto,
	type KnowledgeDocumentSectionsResponseDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
	type KnowledgeNodeContentDto,
	type KnowledgeRecentResponseDto,
	type KnowledgeSearchResponseDto,
	type KnowledgeTreeResponseDto,
} from "@knowledgeprism/types";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import {
	DocumentPlacementError,
	planDocumentCreate,
	planDocumentMove,
	planDocumentRemove,
} from "../libs/helpers/helpers.js";
import { KnowledgeNodeEntity } from "../models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "../repositories/knowledge-node.repository.js";

const EMPTY_DOCUMENT_CONTENT: KnowledgeNodeContentDto = [];

class KnowledgeService {
	private database: Database;

	private knowledgeNodeRepository: KnowledgeNodeRepository;

	private logger: Logger;

	private projectService: ProjectService;

	public constructor({
		database,
		knowledgeNodeRepository,
		logger,
		projectService,
	}: {
		database: Database;
		knowledgeNodeRepository: KnowledgeNodeRepository;
		logger: Logger;
		projectService: ProjectService;
	}) {
		this.database = database;
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.logger = logger;
		this.projectService = projectService;
	}

	private throwPlacementError(error: unknown): never {
		if (!(error instanceof DocumentPlacementError)) {
			throw error;
		}

		if (
			error.message === KnowledgeValidationMessage.NOT_FOUND ||
			error.message === KnowledgeValidationMessage.PARENT_NOT_FOUND
		) {
			throw new HTTPError({
				message: error.message,
				status: HTTPCode.NOT_FOUND,
			});
		}

		throw new HTTPError({
			message: error.message,
			status: HTTPCode.UNPROCESSED_ENTITY,
		});
	}

	public async createDocument({
		context,
		payload,
		projectId,
	}: {
		context: ProjectAccessContext;
		payload: KnowledgeDocumentCreateRequestDto;
		projectId: number;
	}): Promise<KnowledgeEntryResponseDto> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const createdDocument = await this.database.transaction(
			async (transaction) => {
				const nodes = await this.knowledgeNodeRepository.lockByProjectId(
					projectId,
					transaction,
				);
				let placement: ReturnType<typeof planDocumentCreate>;

				try {
					placement = planDocumentCreate({
						nodes: nodes.map((node) => {
							const { id, parentId, position, type } = node.toObject();

							return { id, parentId, position, type };
						}),
						parentId: payload.parentId,
					});
				} catch (error) {
					this.throwPlacementError(error);
				}

				return await this.knowledgeNodeRepository.create(
					{
						entity: KnowledgeNodeEntity.initializeNew({
							contentJson: EMPTY_DOCUMENT_CONTENT,
							parentId: placement.parentId,
							position: placement.position,
							projectId,
							title: payload.title,
							type: KnowledgeNodeType.PAGE,
						}),
						userId: context.userId,
					},
					transaction,
				);
			},
		);

		const created = createdDocument.toObject();

		this.logger.info(
			`User ${String(context.userId)} created knowledge document ${String(created.id)} in project ${String(projectId)}`,
		);

		return created;
	}

	public async findDocumentSections({
		context,
		documentId,
		projectId,
	}: {
		context: ProjectAccessContext;
		documentId: number;
		projectId: number;
	}): Promise<KnowledgeDocumentSectionsResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const document = await this.knowledgeNodeRepository.findByIdAndProjectId(
			documentId,
			projectId,
		);

		if (!document) {
			throw new HTTPError({
				message: KnowledgeValidationMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		const sections = await this.knowledgeNodeRepository.findEntriesByParentId({
			parentId: documentId,
			projectId,
		});

		return {
			items: [document, ...sections].map((node) => node.toObject()),
		};
	}

	public async findEntry({
		context,
		entryId,
		projectId,
	}: {
		context: ProjectAccessContext;
		entryId: number;
		projectId: number;
	}): Promise<KnowledgeEntryResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const entry = await this.knowledgeNodeRepository.findByIdAndProjectId(
			entryId,
			projectId,
		);

		if (!entry) {
			throw new HTTPError({
				message: KnowledgeValidationMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		return entry.toObject();
	}

	public async findRecent(
		context: ProjectAccessContext,
	): Promise<KnowledgeRecentResponseDto> {
		const projectIds =
			await this.projectService.findAccessibleProjectIds(context);
		const entries =
			await this.knowledgeNodeRepository.findRecentByProjectIds(projectIds);

		return {
			items: entries.map((entry) => ({
				id: entry.id,
				projectId: entry.projectId,
				title: entry.title,
				updatedAt: entry.updatedAt.toISOString(),
			})),
		};
	}

	public async findTree({
		context,
		projectId,
	}: {
		context: ProjectAccessContext;
		projectId: number;
	}): Promise<KnowledgeTreeResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const nodes =
			await this.knowledgeNodeRepository.findTreeItemsByProjectId(projectId);

		return {
			items: nodes.map((node) => ({
				id: node.id,
				parentId: node.parentId,
				position: node.position,
				title: node.title,
				type: node.type,
				updatedAt: node.updatedAt.toISOString(),
			})),
		};
	}

	public async moveDocument({
		context,
		nodeId,
		payload,
		projectId,
	}: {
		context: ProjectAccessContext;
		nodeId: number;
		payload: KnowledgeDocumentMoveRequestDto;
		projectId: number;
	}): Promise<KnowledgeEntryResponseDto> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const movedDocument = await this.database.transaction(
			async (transaction) => {
				const nodes = await this.knowledgeNodeRepository.lockByProjectId(
					projectId,
					transaction,
				);
				let updates: ReturnType<typeof planDocumentMove>;

				try {
					updates = planDocumentMove({
						nodeId,
						nodes: nodes.map((node) => {
							const { id, parentId, position, type } = node.toObject();

							return { id, parentId, position, type };
						}),
						parentId: payload.parentId,
						position: payload.position,
					});
				} catch (error) {
					this.throwPlacementError(error);
				}

				let movedNode =
					nodes.find((node) => node.toObject().id === nodeId) ?? null;

				for (const update of updates) {
					const updatedNode =
						await this.knowledgeNodeRepository.updatePlacement(
							{
								id: update.id,
								parentId: update.parentId,
								position: update.position,
								updatedBy: context.userId,
							},
							transaction,
						);

					if (update.id === nodeId) {
						movedNode = updatedNode;
					}
				}

				if (!movedNode) {
					throw new HTTPError({
						message: KnowledgeValidationMessage.NOT_FOUND,
						status: HTTPCode.NOT_FOUND,
					});
				}

				return movedNode;
			},
		);

		const moved = movedDocument.toObject();

		this.logger.info(
			`User ${String(context.userId)} moved knowledge document ${String(moved.id)} in project ${String(projectId)}`,
		);

		return moved;
	}

	public async removeDocument({
		context,
		nodeId,
		projectId,
	}: {
		context: ProjectAccessContext;
		nodeId: number;
		projectId: number;
	}): Promise<void> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		await this.database.transaction(async (transaction) => {
			const nodes = await this.knowledgeNodeRepository.lockByProjectId(
				projectId,
				transaction,
			);
			let removedIds: number[];

			try {
				removedIds = planDocumentRemove({
					nodeId,
					nodes: nodes.map((node) => {
						const { id, parentId, position, type } = node.toObject();

						return { id, parentId, position, type };
					}),
				});
			} catch (error) {
				this.throwPlacementError(error);
			}

			for (const removedId of removedIds) {
				const isDeleted =
					await this.knowledgeNodeRepository.deleteByIdAndProjectId(
						{ id: removedId, projectId },
						transaction,
					);

				if (!isDeleted) {
					throw new HTTPError({
						message: KnowledgeValidationMessage.NOT_FOUND,
						status: HTTPCode.NOT_FOUND,
					});
				}
			}
		});

		this.logger.info(
			`User ${String(context.userId)} removed knowledge document ${String(nodeId)} from project ${String(projectId)}`,
		);
	}

	public async search({
		context,
		projectId,
		query,
	}: {
		context: ProjectAccessContext;
		projectId: number;
		query: string;
	}): Promise<KnowledgeSearchResponseDto> {
		await this.projectService.assertProjectAccess(projectId, context);

		const nodes = await this.knowledgeNodeRepository.searchByTitleOrKeyword({
			projectId,
			query,
		});

		return {
			items: nodes.map((node) => {
				const { contentJson, id, title } = node.toObject();

				return { content: contentJson, id, title };
			}),
		};
	}

	public async updateEntry({
		context,
		entryId,
		payload,
		projectId,
	}: {
		context: ProjectAccessContext;
		entryId: number;
		payload: KnowledgeEntryUpdateRequestDto;
		projectId: number;
	}): Promise<KnowledgeEntryResponseDto> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const existingEntry =
			await this.knowledgeNodeRepository.findByIdAndProjectId(
				entryId,
				projectId,
			);

		if (!existingEntry) {
			throw new HTTPError({
				message: KnowledgeValidationMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		const updatedKnowledgeNode = await this.knowledgeNodeRepository.update({
			contentJson: payload.contentJson,
			id: entryId,
			title: payload.title,
			updatedBy: context.userId,
		});

		this.logger.info(
			`User ${String(context.userId)} updated knowledge entry ${String(entryId)}`,
		);

		return updatedKnowledgeNode.toObject();
	}
}

export { KnowledgeService };
