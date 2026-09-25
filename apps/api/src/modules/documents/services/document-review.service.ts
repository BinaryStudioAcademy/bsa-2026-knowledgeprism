import {
	DocumentErrorMessage,
	DocumentStatus,
	ExtractionItemStatus,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type DocumentStatusResponseDto,
	type ExtractionItemResponseDto,
	type ExtractionItemsResponseDto,
	type ExtractionItemsReviewRequestDto,
	type ExtractionItemsReviewResponseDto,
	type ExtractionItemUpdateRequestDto,
} from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { toDocumentStatusResponse } from "~/modules/documents/libs/helpers/to-document-status-response.helper.js";
import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

const EMPTY_LENGTH = 0;
const PARAGRAPH_BLOCK_TYPE = "paragraph";

type Constructor = {
	database: Database;
	documentRepository: DocumentRepository;
	extractionItemRepository: ExtractionItemRepository;
	knowledgeNodeRepository: KnowledgeNodeRepository;
	projectService: ProjectService;
};

type DocumentReference = {
	context: ProjectAccessContext;
	documentId: number;
	projectId: number;
};

const toExtractionItemResponse = (
	item: ExtractionItemEntity,
): ExtractionItemResponseDto => {
	const {
		confidence,
		id,
		rationale,
		sourceExcerpt,
		sourcePageNumber,
		status,
		text,
		title,
	} = item.toObject();

	return {
		confidence,
		id,
		rationale,
		sourceExcerpt,
		sourcePageNumber,
		status,
		text,
		title,
	};
};

const assertReviewCoversPendingItems = (
	pendingItems: ExtractionItemEntity[],
	{ approvedIds, rejectedIds }: ExtractionItemsReviewRequestDto,
): void => {
	const reviewedIds = [...approvedIds, ...rejectedIds];
	const reviewedIdSet = new Set(reviewedIds);
	const pendingIdSet = new Set(pendingItems.map((item) => item.toObject().id));
	const isExactMatch =
		reviewedIdSet.size === reviewedIds.length &&
		reviewedIdSet.size === pendingIdSet.size &&
		reviewedIds.every((id) => pendingIdSet.has(id));

	if (!isExactMatch) {
		throw new HTTPError({
			message: DocumentErrorMessage.REVIEW_ITEMS_MISMATCH,
			status: HTTPCode.BAD_REQUEST,
		});
	}
};

class DocumentReviewService {
	private database: Database;

	private documentRepository: DocumentRepository;

	private extractionItemRepository: ExtractionItemRepository;

	private knowledgeNodeRepository: KnowledgeNodeRepository;

	private projectService: ProjectService;

	public constructor({
		database,
		documentRepository,
		extractionItemRepository,
		knowledgeNodeRepository,
		projectService,
	}: Constructor) {
		this.database = database;
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
		this.knowledgeNodeRepository = knowledgeNodeRepository;
		this.projectService = projectService;
	}

	private async createKnowledgeNodes(
		{
			approvedItems,
			document,
			userId,
		}: {
			approvedItems: ExtractionItemEntity[];
			document: DocumentEntity;
			userId: number;
		},
		transaction: Transaction,
	): Promise<null | number> {
		if (approvedItems.length === EMPTY_LENGTH) {
			return null;
		}

		const { name, projectId } = document.toObject();
		const pagePosition =
			await this.knowledgeNodeRepository.findNextRootPosition(
				projectId,
				transaction,
			);
		const pageNode = await this.knowledgeNodeRepository.create(
			{
				entity: KnowledgeNodeEntity.initializeNew({
					contentJson: [],
					parentId: null,
					position: pagePosition,
					projectId,
					title: name,
					type: KnowledgeNodeType.PAGE,
				}),
				userId,
			},
			transaction,
		);
		const pageNodeId = pageNode.toObject().id;

		for (const [position, item] of approvedItems.entries()) {
			const { id, text, title } = item.toObject();
			const entryNode = await this.knowledgeNodeRepository.create(
				{
					entity: KnowledgeNodeEntity.initializeNew({
						contentJson: [{ content: text, type: PARAGRAPH_BLOCK_TYPE }],
						parentId: pageNodeId,
						position,
						projectId,
						title,
						type: KnowledgeNodeType.ENTRY,
					}),
					userId,
				},
				transaction,
			);

			await this.extractionItemRepository.markApproved(
				{ id, knowledgeNodeId: entryNode.toObject().id },
				transaction,
			);
		}

		return pageNodeId;
	}

	private async findProjectDocument({
		documentId,
		projectId,
	}: DocumentReference): Promise<DocumentEntity> {
		const document = await this.documentRepository.findByIdAndProjectId({
			id: documentId,
			projectId,
		});

		if (!document) {
			throw new HTTPError({
				message: DocumentErrorMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		return document;
	}

	public async findItems(
		reference: DocumentReference,
	): Promise<ExtractionItemsResponseDto> {
		await this.projectService.assertProjectAccess(
			reference.projectId,
			reference.context,
		);
		await this.findProjectDocument(reference);

		const items = await this.extractionItemRepository.findByDocumentId(
			reference.documentId,
		);

		return {
			items: items.map((item) => toExtractionItemResponse(item)),
		};
	}

	public async findStatus(
		reference: DocumentReference,
	): Promise<DocumentStatusResponseDto> {
		await this.projectService.assertProjectAccess(
			reference.projectId,
			reference.context,
		);

		const document = await this.findProjectDocument(reference);

		return toDocumentStatusResponse(document);
	}

	public async review({
		payload,
		...reference
	}: DocumentReference & {
		payload: ExtractionItemsReviewRequestDto;
	}): Promise<ExtractionItemsReviewResponseDto> {
		await this.projectService.assertCanWriteKnowledge(
			reference.projectId,
			reference.context,
		);

		const document = await this.findProjectDocument(reference);

		if (document.toObject().status !== DocumentStatus.WAITING_FOR_APPROVAL) {
			throw new HTTPError({
				message: DocumentErrorMessage.REVIEW_NOT_ALLOWED,
				status: HTTPCode.CONFLICT,
			});
		}

		const items = await this.extractionItemRepository.findByDocumentId(
			reference.documentId,
		);
		const pendingItems = items.filter(
			(item) => item.toObject().status === ExtractionItemStatus.PENDING,
		);

		assertReviewCoversPendingItems(pendingItems, payload);

		const approvedIdSet = new Set(payload.approvedIds);
		const approvedItems = pendingItems.filter((item) =>
			approvedIdSet.has(item.toObject().id),
		);

		return await this.database.transaction(async (transaction) => {
			const completedDocument =
				await this.documentRepository.compareAndSwapStatus(
					{
						errorMessage: null,
						expectedStatus: DocumentStatus.WAITING_FOR_APPROVAL,
						id: reference.documentId,
						status: DocumentStatus.COMPLETED,
					},
					transaction,
				);

			if (!completedDocument) {
				throw new HTTPError({
					message: DocumentErrorMessage.REVIEW_NOT_ALLOWED,
					status: HTTPCode.CONFLICT,
				});
			}

			const pageNodeId = await this.createKnowledgeNodes(
				{ approvedItems, document, userId: reference.context.userId },
				transaction,
			);

			await this.extractionItemRepository.markRejected(
				payload.rejectedIds,
				transaction,
			);

			return {
				documentId: reference.documentId,
				pageNodeId,
				status: completedDocument.toObject().status,
			};
		});
	}

	public async updateItem({
		id,
		payload,
		...reference
	}: DocumentReference & {
		id: number;
		payload: ExtractionItemUpdateRequestDto;
	}): Promise<ExtractionItemResponseDto> {
		await this.projectService.assertCanWriteKnowledge(
			reference.projectId,
			reference.context,
		);

		const document = await this.findProjectDocument(reference);

		if (document.toObject().status !== DocumentStatus.WAITING_FOR_APPROVAL) {
			throw new HTTPError({
				message: DocumentErrorMessage.REVIEW_NOT_ALLOWED,
				status: HTTPCode.CONFLICT,
			});
		}

		const item = await this.extractionItemRepository.findById(id);

		if (!item || item.toObject().documentId !== reference.documentId) {
			throw new HTTPError({
				message: DocumentErrorMessage.EXTRACTION_ITEM_NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		if (item.toObject().status !== ExtractionItemStatus.PENDING) {
			throw new HTTPError({
				message: DocumentErrorMessage.EXTRACTION_ITEM_NOT_PENDING,
				status: HTTPCode.CONFLICT,
			});
		}

		const updated = await this.extractionItemRepository.updateContent(id, {
			text: payload.text.trim(),
			title: payload.title.trim(),
		});

		return toExtractionItemResponse(updated);
	}
}

export { type DocumentReference, DocumentReviewService };
