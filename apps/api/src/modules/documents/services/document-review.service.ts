import {
	DocumentErrorMessage,
	DocumentStatus,
	ExtractionItemStatus,
} from "@knowledgeprism/constants";
import {
	type DocumentStatusResponseDto,
	type ExtractionItemResponseDto,
	type ExtractionItemsResponseDto,
	type ExtractionItemsReviewRequestDto,
	type ExtractionItemsReviewResponseDto,
	type IntegrationChangeResponseDto,
	type IntegrationChangesResponseDto,
} from "@knowledgeprism/types";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { toDocumentStatusResponse } from "~/modules/documents/libs/helpers/to-document-status-response.helper.js";
import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { type IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type IntegrationChangeRepository } from "~/modules/documents/repositories/integration-change.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { type DocumentJobScheduler } from "./document-job-scheduler.js";

const EMPTY_LENGTH = 0;

type Constructor = {
	database: Database;
	documentJobScheduler: DocumentJobScheduler;
	documentRepository: DocumentRepository;
	extractionItemRepository: ExtractionItemRepository;
	integrationChangeRepository: IntegrationChangeRepository;
	projectService: ProjectService;
};

type DocumentReference = {
	context: ProjectAccessContext;
	documentId: number;
	projectId: number;
};

const createReviewNotAllowedError = (): HTTPError => {
	return new HTTPError({
		message: DocumentErrorMessage.REVIEW_NOT_ALLOWED,
		status: HTTPCode.CONFLICT,
	});
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

const toIntegrationChangeResponse = (
	change: IntegrationChangeEntity,
): IntegrationChangeResponseDto => {
	const {
		explanation,
		extractionItemId,
		id,
		incomingContent,
		incomingTitle,
		liveContent,
		liveTitle,
		matchedNodeId,
		score,
		type,
	} = change.toObject();

	return {
		explanation,
		extractionItemId,
		id,
		incomingContent,
		incomingTitle,
		liveContent,
		liveTitle,
		matchedNodeId,
		score,
		type,
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

	private documentJobScheduler: DocumentJobScheduler;

	private documentRepository: DocumentRepository;

	private extractionItemRepository: ExtractionItemRepository;

	private integrationChangeRepository: IntegrationChangeRepository;

	private projectService: ProjectService;

	public constructor({
		database,
		documentJobScheduler,
		documentRepository,
		extractionItemRepository,
		integrationChangeRepository,
		projectService,
	}: Constructor) {
		this.database = database;
		this.documentJobScheduler = documentJobScheduler;
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
		this.integrationChangeRepository = integrationChangeRepository;
		this.projectService = projectService;
	}

	private async completeWithoutApprovals({
		documentId,
		rejectedIds,
	}: {
		documentId: number;
		rejectedIds: number[];
	}): Promise<DocumentEntity> {
		return await this.database.transaction(async (transaction) => {
			const completedDocument =
				await this.documentRepository.compareAndSwapStatus(
					{
						errorMessage: null,
						expectedStatus: DocumentStatus.WAITING_FOR_VALIDATION,
						id: documentId,
						status: DocumentStatus.COMPLETED,
					},
					transaction,
				);

			if (!completedDocument) {
				throw createReviewNotAllowedError();
			}

			await this.extractionItemRepository.markRejected(
				rejectedIds,
				transaction,
			);

			return completedDocument;
		});
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

	private async startIntegration({
		approvedIds,
		documentId,
		rejectedIds,
	}: ExtractionItemsReviewRequestDto & {
		documentId: number;
	}): Promise<DocumentEntity> {
		const integration = await this.database.transaction(async (transaction) => {
			const startedIntegration = await this.documentRepository.startProcessing(
				{
					allowedStatuses: [DocumentStatus.WAITING_FOR_VALIDATION],
					id: documentId,
					status: DocumentStatus.INTEGRATING,
				},
				transaction,
			);

			if (!startedIntegration) {
				throw createReviewNotAllowedError();
			}

			await this.extractionItemRepository.markApproved(
				approvedIds,
				transaction,
			);
			await this.extractionItemRepository.markRejected(
				rejectedIds,
				transaction,
			);

			return startedIntegration;
		});

		this.documentJobScheduler.scheduleIntegration({
			attempt: integration.attempt,
			documentId,
		});

		return integration.document;
	}

	public async findIntegrationChanges(
		reference: DocumentReference,
	): Promise<IntegrationChangesResponseDto> {
		await this.projectService.assertProjectAccess(
			reference.projectId,
			reference.context,
		);
		await this.findProjectDocument(reference);

		const changes = await this.integrationChangeRepository.findByDocumentId(
			reference.documentId,
		);

		return {
			items: changes.map((change) => toIntegrationChangeResponse(change)),
		};
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

		if (document.toObject().status !== DocumentStatus.WAITING_FOR_VALIDATION) {
			throw createReviewNotAllowedError();
		}

		const items = await this.extractionItemRepository.findByDocumentId(
			reference.documentId,
		);
		const pendingItems = items.filter(
			(item) => item.toObject().status === ExtractionItemStatus.PENDING,
		);

		assertReviewCoversPendingItems(pendingItems, payload);

		const reviewedDocument =
			payload.approvedIds.length === EMPTY_LENGTH
				? await this.completeWithoutApprovals({
						documentId: reference.documentId,
						rejectedIds: payload.rejectedIds,
					})
				: await this.startIntegration({
						...payload,
						documentId: reference.documentId,
					});

		return {
			documentId: reference.documentId,
			status: reviewedDocument.toObject().status,
		};
	}
}

export { type DocumentReference, DocumentReviewService };
