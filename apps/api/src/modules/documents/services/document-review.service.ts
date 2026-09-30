import {
	DocumentErrorMessage,
	DocumentStatus,
	ExtractionItemStatus,
	IntegrationChangeType,
} from "@knowledgeprism/constants";
import {
	type DocumentStatusResponseDto,
	type ExtractionItemResponseDto,
	type ExtractionItemsResponseDto,
	type ExtractionItemsReviewRequestDto,
	type ExtractionItemsReviewResponseDto,
	type ExtractionItemsReviewSectionDto,
	type ExtractionItemUpdateRequestDto,
	type ExtractionSectionResponseDto,
	type IntegrationChangeResponseDto,
	type IntegrationChangesApplyRequestDto,
	type IntegrationChangesResponseDto,
	type PendingReviewDocumentsResponseDto,
} from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { getIncomingFields } from "~/modules/documents/libs/helpers/get-incoming-fields.helper.js";
import { toDocumentStatusResponse } from "~/modules/documents/libs/helpers/to-document-status-response.helper.js";
import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { type ExtractionSectionEntity } from "~/modules/documents/models/extraction-section.entity.js";
import { type IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { type ExtractionSectionRepository } from "~/modules/documents/repositories/extraction-section.repository.js";
import { type IntegrationChangeRepository } from "~/modules/documents/repositories/integration-change.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { type DocumentJobScheduler } from "./document-job-scheduler.js";
import {
	IntegrationAnalysisOutdatedError,
	type IntegrationApplier,
} from "./integration-applier.js";

const EMPTY_LENGTH = 0;
const FIRST_PAGE_NUMBER = 1;
const MANUAL_ITEM_CONFIDENCE = 1;
const MANUAL_ITEM_RATIONALE = "Created manually during extraction review.";
const MANUAL_ITEM_SOURCE_EXCERPT = "Manual review item.";

type Constructor = {
	database: Database;
	documentJobScheduler: DocumentJobScheduler;
	documentRepository: DocumentRepository;
	extractionItemRepository: ExtractionItemRepository;
	extractionSectionRepository: ExtractionSectionRepository;
	integrationApplier: IntegrationApplier;
	integrationChangeRepository: IntegrationChangeRepository;
	projectService: ProjectService;
};

type DocumentReference = {
	context: ProjectAccessContext;
	documentId: number;
	projectId: number;
};

const createApplyNotAllowedError = (): HTTPError => {
	return new HTTPError({
		message: DocumentErrorMessage.APPLY_NOT_ALLOWED,
		status: HTTPCode.CONFLICT,
	});
};

const createReviewNotAllowedError = (): HTTPError => {
	return new HTTPError({
		message: DocumentErrorMessage.REVIEW_NOT_ALLOWED,
		status: HTTPCode.CONFLICT,
	});
};

const toExtractionItemResponse = (
	item: ExtractionItemEntity,
	sectionById: Map<
		number,
		{
			position: number;
			title: string;
		}
	> = new Map(),
): ExtractionItemResponseDto => {
	const {
		confidence,
		extractionSectionId,
		id,
		position,
		rationale,
		sourceExcerpt,
		sourcePageNumber,
		status,
		text,
		title,
	} = item.toObject();

	const section =
		extractionSectionId === null ? null : sectionById.get(extractionSectionId);
	const response: ExtractionItemResponseDto = {
		confidence,
		extractionSectionId,
		id,
		position,
		rationale,
		sourceExcerpt,
		sourcePageNumber,
		status,
		text,
		title,
	};

	if (section) {
		response.sectionPosition = section.position;
		response.sectionTitle = section.title;
	}

	return response;
};

const toSectionById = (
	sections: ExtractionSectionEntity[],
): Map<number, { position: number; title: string }> =>
	new Map(
		sections.map((section) => {
			const sectionObject = section.toObject();

			return [
				sectionObject.id,
				{
					position: sectionObject.position,
					title: sectionObject.title,
				},
			];
		}),
	);

const toExtractionSectionResponse = (
	section: ExtractionSectionEntity,
): ExtractionSectionResponseDto => {
	const { id, position, title } = section.toObject();

	return { id, position, title };
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

const isExactIdMatch = (
	expectedIds: number[],
	providedIds: number[],
): boolean => {
	const providedIdSet = new Set(providedIds);
	const expectedIdSet = new Set(expectedIds);

	return (
		providedIdSet.size === providedIds.length &&
		providedIdSet.size === expectedIdSet.size &&
		providedIds.every((id) => expectedIdSet.has(id))
	);
};

const getNonPendingSectionIds = (items: ExtractionItemEntity[]): number[] => {
	const sectionIds = items
		.filter((item) => item.toObject().status !== ExtractionItemStatus.PENDING)
		.map((item) => item.toObject().extractionSectionId)
		.filter((sectionId): sectionId is number => sectionId !== null);

	return [...new Set(sectionIds)];
};

const assertReviewCoversPendingItems = (
	pendingItems: ExtractionItemEntity[],
	{ approvedIds, rejectedIds }: ExtractionItemsReviewRequestDto,
): void => {
	const pendingIds = pendingItems.map((item) => item.toObject().id);

	if (!isExactIdMatch(pendingIds, [...approvedIds, ...rejectedIds])) {
		throw new HTTPError({
			message: DocumentErrorMessage.REVIEW_ITEMS_MISMATCH,
			status: HTTPCode.BAD_REQUEST,
		});
	}
};

const assertResolutionsCoverConflicts = (
	changes: IntegrationChangeEntity[],
	{ resolutions }: IntegrationChangesApplyRequestDto,
): void => {
	const conflictIds = changes
		.map((change) => change.toObject())
		.filter(({ type }) => type === IntegrationChangeType.CONFLICT)
		.map(({ id }) => id);
	const resolvedIds = resolutions.map(({ changeId }) => changeId);

	if (!isExactIdMatch(conflictIds, resolvedIds)) {
		throw new HTTPError({
			message: DocumentErrorMessage.CONFLICT_RESOLUTIONS_MISMATCH,
			status: HTTPCode.BAD_REQUEST,
		});
	}
};

const assertSingleWritePerEntryField = (
	changes: IntegrationChangeEntity[],
	{ resolutions }: IntegrationChangesApplyRequestDto,
): void => {
	const resolutionByChangeId = new Map(
		resolutions.map((resolution) => [resolution.changeId, resolution]),
	);
	const writtenFields = new Set<string>();

	for (const change of changes) {
		const { id, matchedNodeId, type } = change.toObject();

		if (matchedNodeId === null) {
			continue;
		}

		const incomingFields = getIncomingFields(
			type,
			resolutionByChangeId.get(id),
		);

		for (const [field, isWritten] of Object.entries(incomingFields)) {
			const fieldKey = `${String(matchedNodeId)}:${field}`;

			if (isWritten && writtenFields.has(fieldKey)) {
				throw new HTTPError({
					message: DocumentErrorMessage.DUPLICATE_ENTRY_WRITES,
					status: HTTPCode.BAD_REQUEST,
				});
			}

			if (isWritten) {
				writtenFields.add(fieldKey);
			}
		}
	}
};

type NormalizedExtractionReview = {
	approvedIds: number[];
	rejectedIds: number[];
};

class DocumentReviewService {
	private database: Database;

	private documentJobScheduler: DocumentJobScheduler;

	private documentRepository: DocumentRepository;

	private extractionItemRepository: ExtractionItemRepository;

	private extractionSectionRepository: ExtractionSectionRepository;

	private integrationApplier: IntegrationApplier;

	private integrationChangeRepository: IntegrationChangeRepository;

	private projectService: ProjectService;

	public constructor({
		database,
		documentJobScheduler,
		documentRepository,
		extractionItemRepository,
		extractionSectionRepository,
		integrationApplier,
		integrationChangeRepository,
		projectService,
	}: Constructor) {
		this.database = database;
		this.documentJobScheduler = documentJobScheduler;
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
		this.extractionSectionRepository = extractionSectionRepository;
		this.integrationApplier = integrationApplier;
		this.integrationChangeRepository = integrationChangeRepository;
		this.projectService = projectService;
	}

	private async applyInTransaction({
		changes,
		document,
		resolutions,
		userId,
	}: {
		changes: IntegrationChangeEntity[];
		document: DocumentEntity;
		resolutions: IntegrationChangesApplyRequestDto["resolutions"];
		userId: number;
	}): Promise<DocumentEntity> {
		return await this.database.transaction(async (transaction) => {
			const approvedDocument =
				await this.documentRepository.compareAndSwapStatus(
					{
						errorMessage: null,
						expectedStatus: DocumentStatus.WAITING_FOR_APPROVAL,
						id: document.toObject().id,
						status: DocumentStatus.COMPLETED,
					},
					transaction,
				);

			if (!approvedDocument) {
				throw createApplyNotAllowedError();
			}

			await this.integrationApplier.apply(
				{ changes, document, resolutions, userId },
				transaction,
			);

			return approvedDocument;
		});
	}

	private async applyStructuredExtractionReview(
		{
			documentId,
			pendingItems,
			preserveSectionIds,
			sections,
		}: {
			documentId: number;
			pendingItems: ExtractionItemEntity[];
			preserveSectionIds: number[];
			sections: ExtractionItemsReviewSectionDto[];
		},
		transaction: Transaction,
	): Promise<NormalizedExtractionReview> {
		const pendingItemsById = new Map(
			pendingItems.map((item) => [item.toObject().id, item]),
		);
		const usedPendingIds = new Set<number>();
		const approvedIds: number[] = [];
		const { positionOffset, sections: createdSections } =
			await this.extractionSectionRepository.replaceByDocumentId(
				{
					documentId,
					preserveSectionIds,
					sections: sections.map((section, position) => ({
						position,
						title: section.title.trim(),
					})),
				},
				transaction,
			);
		const createdSectionByPosition = new Map(
			createdSections.map((section) => {
				const sectionObject = section.toObject();

				return [sectionObject.position, sectionObject];
			}),
		);

		for (const [sectionIndex, section] of sections.entries()) {
			const createdSection = createdSectionByPosition.get(
				sectionIndex + positionOffset,
			);

			if (createdSection) {
				const sectionApprovedIds = await this.applyStructuredReviewSection(
					{
						documentId,
						pendingItemsById,
						section,
						sectionId: createdSection.id,
						sectionPageNumber: sectionIndex + FIRST_PAGE_NUMBER,
						usedPendingIds,
					},
					transaction,
				);

				approvedIds.push(...sectionApprovedIds);
			}
		}

		const rejectedIds = pendingItems
			.map((item) => item.toObject().id)
			.filter((id) => !usedPendingIds.has(id));

		return { approvedIds, rejectedIds };
	}

	private async applyStructuredReviewSection(
		{
			documentId,
			pendingItemsById,
			section,
			sectionId,
			sectionPageNumber,
			usedPendingIds,
		}: {
			documentId: number;
			pendingItemsById: Map<number, ExtractionItemEntity>;
			section: ExtractionItemsReviewSectionDto;
			sectionId: number;
			sectionPageNumber: number;
			usedPendingIds: Set<number>;
		},
		transaction: Transaction,
	): Promise<number[]> {
		const approvedIds: number[] = [];
		const manualItems: { itemPosition: number; text: string; title: string }[] =
			[];

		for (const [itemPosition, item] of section.items.entries()) {
			const text = item.text.trim();
			const title = item.title.trim();

			if (item.id) {
				const approvedId = await this.updateExistingStructuredReviewItem(
					{
						documentId,
						id: item.id,
						itemPosition,
						pendingItemsById,
						sectionId,
						text,
						title,
						usedPendingIds,
					},
					transaction,
				);

				approvedIds.push(approvedId);
				continue;
			}

			manualItems.push({ itemPosition, text, title });
		}

		if (manualItems.length > EMPTY_LENGTH) {
			const createdItems =
				await this.extractionItemRepository.insertManyPending(
					{
						documentId,
						items: manualItems.map(({ itemPosition, text, title }) => ({
							confidence: MANUAL_ITEM_CONFIDENCE,
							extractionSectionId: sectionId,
							position: itemPosition,
							rationale: MANUAL_ITEM_RATIONALE,
							sourceExcerpt: MANUAL_ITEM_SOURCE_EXCERPT,
							sourcePageNumber: sectionPageNumber,
							text,
							title,
						})),
					},
					transaction,
				);

			approvedIds.push(
				...createdItems.map((createdItem) => createdItem.toObject().id),
			);
		}

		return approvedIds;
	}

	private async executeCompletionWithoutApprovals(
		{
			documentId,
			rejectedIds,
		}: {
			documentId: number;
			rejectedIds: number[];
		},
		transaction: Transaction,
	): Promise<DocumentEntity> {
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

		await this.extractionItemRepository.markRejected(rejectedIds, transaction);

		return completedDocument;
	}

	private async executeIntegrationStart(
		{
			approvedIds,
			documentId,
			rejectedIds,
		}: ExtractionItemsReviewRequestDto & {
			documentId: number;
		},
		transaction: Transaction,
	): Promise<{ attempt: number; document: DocumentEntity }> {
		const integration = await this.documentRepository.startProcessing(
			{
				allowedStatuses: [DocumentStatus.WAITING_FOR_VALIDATION],
				id: documentId,
				status: DocumentStatus.INTEGRATING,
			},
			transaction,
		);

		if (!integration) {
			throw createReviewNotAllowedError();
		}

		await this.extractionItemRepository.markApproved(approvedIds, transaction);
		await this.extractionItemRepository.markRejected(rejectedIds, transaction);

		return integration;
	}

	private async findProjectDocument(
		{ documentId, projectId }: DocumentReference,
		options?: { forUpdate?: boolean; transaction?: Transaction },
	): Promise<DocumentEntity> {
		const document = await this.documentRepository.findByIdAndProjectId(
			{
				id: documentId,
				projectId,
			},
			options,
		);

		if (!document) {
			throw new HTTPError({
				message: DocumentErrorMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		return document;
	}

	private async restartIntegration(documentId: number): Promise<void> {
		const integration = await this.documentRepository.startProcessing({
			allowedStatuses: [DocumentStatus.WAITING_FOR_APPROVAL],
			id: documentId,
			status: DocumentStatus.INTEGRATING,
		});

		if (integration) {
			this.documentJobScheduler.scheduleIntegration({
				attempt: integration.attempt,
				documentId,
			});
		}
	}

	private async updateExistingStructuredReviewItem(
		{
			documentId,
			id,
			itemPosition,
			pendingItemsById,
			sectionId,
			text,
			title,
			usedPendingIds,
		}: {
			documentId: number;
			id: number;
			itemPosition: number;
			pendingItemsById: Map<number, ExtractionItemEntity>;
			sectionId: number;
			text: string;
			title: string;
			usedPendingIds: Set<number>;
		},
		transaction: Transaction,
	): Promise<number> {
		if (usedPendingIds.has(id) || !pendingItemsById.has(id)) {
			throw new HTTPError({
				message: DocumentErrorMessage.REVIEW_ITEMS_MISMATCH,
				status: HTTPCode.BAD_REQUEST,
			});
		}

		const updated =
			await this.extractionItemRepository.updatePendingReviewPlacement(
				{
					documentId,
					extractionSectionId: sectionId,
					id,
					position: itemPosition,
					text,
					title,
				},
				transaction,
			);

		if (!updated) {
			throw new HTTPError({
				message: DocumentErrorMessage.EXTRACTION_ITEM_NOT_PENDING,
				status: HTTPCode.CONFLICT,
			});
		}

		usedPendingIds.add(id);

		return id;
	}

	public async applyIntegrationChanges({
		payload,
		...reference
	}: DocumentReference & {
		payload: IntegrationChangesApplyRequestDto;
	}): Promise<DocumentStatusResponseDto> {
		await this.projectService.assertCanWriteKnowledge(
			reference.projectId,
			reference.context,
		);

		const document = await this.findProjectDocument(reference);

		if (document.toObject().status !== DocumentStatus.WAITING_FOR_APPROVAL) {
			throw createApplyNotAllowedError();
		}

		const changes = await this.integrationChangeRepository.findByDocumentId(
			reference.documentId,
		);

		assertResolutionsCoverConflicts(changes, payload);
		assertSingleWritePerEntryField(changes, payload);

		try {
			const completedDocument = await this.applyInTransaction({
				changes,
				document,
				resolutions: payload.resolutions,
				userId: reference.context.userId,
			});

			return toDocumentStatusResponse(completedDocument);
		} catch (error) {
			if (!(error instanceof IntegrationAnalysisOutdatedError)) {
				throw error;
			}

			await this.restartIntegration(reference.documentId);

			throw new HTTPError({
				cause: error,
				message: DocumentErrorMessage.ANALYSIS_OUTDATED,
				status: HTTPCode.CONFLICT,
			});
		}
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
		const document = await this.findProjectDocument(reference);

		const items = await this.extractionItemRepository.findByDocumentId(
			reference.documentId,
		);
		const sections = await this.extractionSectionRepository.findByDocumentId(
			reference.documentId,
		);
		const sectionById = toSectionById(sections);

		return {
			failedPageNumbers: document.toObject().failedPageNumbers,
			items: items.map((item) => toExtractionItemResponse(item, sectionById)),
			sections: sections.map((section) => toExtractionSectionResponse(section)),
		};
	}

	public async findPendingReviews({
		context,
		projectId,
	}: {
		context: ProjectAccessContext;
		projectId: number;
	}): Promise<PendingReviewDocumentsResponseDto> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const documents = await this.documentRepository.findByProjectIdAndStatuses({
			projectId,
			statuses: [
				DocumentStatus.WAITING_FOR_VALIDATION,
				DocumentStatus.WAITING_FOR_APPROVAL,
			],
		});

		return {
			items: documents.map((document) => toDocumentStatusResponse(document)),
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

		const { attempt, documentId, shouldSchedule, status } =
			await this.database.transaction(async (transaction) => {
				const document = await this.findProjectDocument(reference, {
					forUpdate: true,
					transaction,
				});

				if (
					document.toObject().status !== DocumentStatus.WAITING_FOR_VALIDATION
				) {
					throw createReviewNotAllowedError();
				}

				const items = await this.extractionItemRepository.findByDocumentId(
					reference.documentId,
					transaction,
				);
				const pendingItems = items.filter(
					(item) => item.toObject().status === ExtractionItemStatus.PENDING,
				);

				const review = payload.sections
					? await this.applyStructuredExtractionReview(
							{
								documentId: reference.documentId,
								pendingItems,
								preserveSectionIds: getNonPendingSectionIds(items),
								sections: payload.sections,
							},
							transaction,
						)
					: payload;

				if (!payload.sections) {
					assertReviewCoversPendingItems(pendingItems, payload);
				}

				const hasApprovedItems = review.approvedIds.length > EMPTY_LENGTH;

				if (!hasApprovedItems) {
					const completedDocument =
						await this.executeCompletionWithoutApprovals(
							{
								documentId: reference.documentId,
								rejectedIds: review.rejectedIds,
							},
							transaction,
						);

					return {
						attempt: null,
						documentId: reference.documentId,
						shouldSchedule: false,
						status: completedDocument.toObject().status,
					};
				}

				const integration = await this.executeIntegrationStart(
					{
						...review,
						documentId: reference.documentId,
					},
					transaction,
				);

				return {
					attempt: integration.attempt,
					documentId: reference.documentId,
					shouldSchedule: true,
					status: integration.document.toObject().status,
				};
			});

		if (shouldSchedule && attempt !== null) {
			this.documentJobScheduler.scheduleIntegration({
				attempt,
				documentId,
			});
		}

		return {
			documentId,
			status,
		};
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

		return await this.database.transaction(async (transaction) => {
			const document = await this.findProjectDocument(reference, {
				forUpdate: true,
				transaction,
			});

			if (
				document.toObject().status !== DocumentStatus.WAITING_FOR_VALIDATION
			) {
				throw createReviewNotAllowedError();
			}

			const item = await this.extractionItemRepository.findById(
				id,
				transaction,
			);

			if (!item || item.toObject().documentId !== reference.documentId) {
				throw new HTTPError({
					message: DocumentErrorMessage.EXTRACTION_ITEM_NOT_FOUND,
					status: HTTPCode.NOT_FOUND,
				});
			}

			const updated = await this.extractionItemRepository.updatePendingContent(
				{
					documentId: reference.documentId,
					id,
					payload: {
						text: payload.text.trim(),
						title: payload.title.trim(),
					},
				},
				transaction,
			);

			if (!updated) {
				throw new HTTPError({
					message: DocumentErrorMessage.EXTRACTION_ITEM_NOT_PENDING,
					status: HTTPCode.CONFLICT,
				});
			}

			const sections = await this.extractionSectionRepository.findByDocumentId(
				reference.documentId,
				transaction,
			);

			return toExtractionItemResponse(updated, toSectionById(sections));
		});
	}
}

export { type DocumentReference, DocumentReviewService };
