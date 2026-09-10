import {
	DocumentErrorMessage,
	DocumentSourceType,
	DocumentStatus,
} from "@knowledgeprism/constants";
import {
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentResponseDto,
	type DocumentUploadIntentRouteParametersDto,
	type ManualTextCreateRequestDto,
	type ManualTextResponseDto,
} from "@knowledgeprism/types";

import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { type GeneratePresignedUploadUrl } from "~/infrastructure/s3/libs/types/types.js";
import { createContentHash } from "~/modules/documents/libs/helpers/create-content-hash.helper.js";
import { buildDocumentStorageKey } from "~/modules/documents/libs/helpers/helpers.js";
import { isUniqueViolation } from "~/modules/documents/libs/helpers/is-unique-violation.helper.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

import { type DocumentAccessService } from "./document-access.service.js";
import { type DocumentProcessor } from "./document-processor.js";

const MANUAL_TEXT_MIME_TYPE = "text/plain";
const UNTITLED_MANUAL_DOCUMENT_NAME = "Untitled";

type Constructor = {
	documentAccessService: DocumentAccessService;
	documentProcessor: DocumentProcessor;
	documentRepository: DocumentRepository;
	generatePresignedUploadUrl: GeneratePresignedUploadUrl;
	logger: Logger;
};

class DocumentService {
	private documentAccessService: DocumentAccessService;

	private documentProcessor: DocumentProcessor;

	private documentRepository: DocumentRepository;

	private generatePresignedUploadUrl: GeneratePresignedUploadUrl;

	private logger: Logger;

	public constructor({
		documentAccessService,
		documentProcessor,
		documentRepository,
		generatePresignedUploadUrl,
		logger,
	}: Constructor) {
		this.documentAccessService = documentAccessService;
		this.documentProcessor = documentProcessor;
		this.documentRepository = documentRepository;
		this.generatePresignedUploadUrl = generatePresignedUploadUrl;
		this.logger = logger;
	}

	private async completeProcessing(id: number): Promise<void> {
		try {
			await this.documentProcessor.process();
			await this.documentRepository.compareAndSwapStatus({
				errorMessage: null,
				expectedStatus: DocumentStatus.PROCESSING,
				id,
				status: DocumentStatus.WAITING_FOR_APPROVAL,
			});
		} catch {
			await this.documentRepository.compareAndSwapStatus({
				errorMessage: DocumentErrorMessage.PROCESSING_FAILED,
				expectedStatus: DocumentStatus.PROCESSING,
				id,
				status: DocumentStatus.FAILED,
			});
		}
	}

	private async findOwnedDocument({
		id,
		projectId,
	}: {
		id: number;
		projectId: string;
	}): Promise<DocumentEntity> {
		const document = await this.documentRepository.findByIdAndProjectId({
			id,
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

	private normalizeTitle(title: string | undefined): null | string {
		if (!title) {
			return null;
		}

		const trimmedTitle = title.trim();

		return trimmedTitle === "" ? null : trimmedTitle;
	}

	private scheduleProcessing(id: number): void {
		setImmediate(() => {
			void this.completeProcessing(id);
		});
	}

	private toManualTextResponse(
		document: DocumentEntity,
	): ManualTextResponseDto {
		const documentObject = document.toObject();

		return {
			createdAt: documentObject.createdAt,
			errorMessage: documentObject.errorMessage,
			id: documentObject.id,
			projectId: documentObject.projectId,
			sourceType: documentObject.sourceType,
			status: documentObject.status,
			title:
				documentObject.name === UNTITLED_MANUAL_DOCUMENT_NAME
					? null
					: documentObject.name,
			updatedAt: documentObject.updatedAt,
		};
	}

	public async cancelManualText({
		id,
		projectId,
		userId,
	}: {
		id: number;
		projectId: string;
		userId: number;
	}): Promise<ManualTextResponseDto> {
		await this.documentAccessService.assertCanAddKnowledge({
			projectId,
			userId,
		});
		await this.findOwnedDocument({
			id,
			projectId,
		});

		const cancelledDocument =
			await this.documentRepository.updateStatusIfCurrentIn({
				allowedStatuses: [DocumentStatus.FAILED, DocumentStatus.PROCESSING],
				errorMessage: null,
				id,
				status: DocumentStatus.CANCELLED,
			});

		if (!cancelledDocument) {
			throw new HTTPError({
				message: DocumentErrorMessage.CANCEL_NOT_ALLOWED,
				status: HTTPCode.CONFLICT,
			});
		}

		return this.toManualTextResponse(cancelledDocument);
	}

	public async createManualText({
		payload,
		projectId,
		userId,
	}: {
		payload: ManualTextCreateRequestDto;
		projectId: string;
		userId: number;
	}): Promise<ManualTextResponseDto> {
		await this.documentAccessService.assertCanAddKnowledge({
			projectId,
			userId,
		});

		const title = this.normalizeTitle(payload.title);
		const contentHash = createContentHash(title, payload.content);
		const inFlightDocument = await this.documentRepository.findProcessingByHash(
			{
				contentHash,
				projectId,
				uploadedBy: userId,
			},
		);

		if (inFlightDocument) {
			return this.toManualTextResponse(inFlightDocument);
		}

		let createdDocument: DocumentEntity;

		try {
			createdDocument = await this.documentRepository.create(
				DocumentEntity.initializeNew({
					content: payload.content,
					contentHash,
					errorMessage: null,
					mimeType: MANUAL_TEXT_MIME_TYPE,
					name: title ?? UNTITLED_MANUAL_DOCUMENT_NAME,
					projectId,
					s3Key: null,
					sizeInBytes: null,
					sourceType: DocumentSourceType.MANUAL,
					status: DocumentStatus.PROCESSING,
					uploadedBy: userId,
				}),
			);
		} catch (error) {
			if (!isUniqueViolation(error)) {
				throw error;
			}

			const existingDocument =
				await this.documentRepository.findProcessingByHash({
					contentHash,
					projectId,
					uploadedBy: userId,
				});

			if (!existingDocument) {
				throw error;
			}

			return this.toManualTextResponse(existingDocument);
		}

		const createdDocumentDto = this.toManualTextResponse(createdDocument);

		this.scheduleProcessing(createdDocumentDto.id);

		return createdDocumentDto;
	}

	public async createUploadIntent({
		payload,
		routeParameters,
	}: {
		payload: DocumentUploadIntentRequestDto;
		routeParameters: DocumentUploadIntentRouteParametersDto;
	}): Promise<DocumentUploadIntentResponseDto> {
		const storageKey = buildDocumentStorageKey({
			fileName: payload.fileName,
			projectId: routeParameters.projectId,
		});

		let uploadUrl: string;

		try {
			uploadUrl = await this.generatePresignedUploadUrl({
				contentType: payload.contentType,
				key: storageKey,
			});
		} catch (error) {
			this.logger.error("Failed to create S3 presigned upload URL.", {
				error,
				storageKey,
			});

			throw new HTTPError({
				cause: error,
				message: "Failed to create upload URL.",
				status: HTTPCode.INTERNAL_SERVER_ERROR,
			});
		}

		let document: DocumentEntity;

		try {
			document = await this.documentRepository.create(
				DocumentEntity.initializeNew({
					content: null,
					contentHash: null,
					errorMessage: null,
					mimeType: payload.contentType,
					name: payload.fileName,
					projectId: routeParameters.projectId,
					s3Key: storageKey,
					sizeInBytes: payload.sizeInBytes ?? null,
					sourceType: DocumentSourceType.UPLOAD,
					status: DocumentStatus.UPLOADED,
					uploadedBy: null,
				}),
			);
		} catch (error) {
			this.logger.error("Failed to create document upload intent.", {
				error,
				storageKey,
			});

			throw new HTTPError({
				cause: error,
				message: "Failed to create document upload intent.",
				status: HTTPCode.INTERNAL_SERVER_ERROR,
			});
		}

		const documentObject = document.toObject();

		return {
			documentId: documentObject.id,
			expiresInSeconds: PRESIGNED_URL_EXPIRY_SECONDS,
			storageKey,
			uploadUrl,
		};
	}

	public async findManualText({
		id,
		projectId,
		userId,
	}: {
		id: number;
		projectId: string;
		userId: number;
	}): Promise<ManualTextResponseDto> {
		await this.documentAccessService.assertCanViewKnowledge({
			projectId,
			userId,
		});
		const document = await this.findOwnedDocument({
			id,
			projectId,
		});

		return this.toManualTextResponse(document);
	}

	public async retryManualText({
		id,
		projectId,
		userId,
	}: {
		id: number;
		projectId: string;
		userId: number;
	}): Promise<ManualTextResponseDto> {
		await this.documentAccessService.assertCanAddKnowledge({
			projectId,
			userId,
		});
		await this.findOwnedDocument({
			id,
			projectId,
		});

		const retriedDocument = await this.documentRepository.compareAndSwapStatus({
			errorMessage: null,
			expectedStatus: DocumentStatus.FAILED,
			id,
			status: DocumentStatus.PROCESSING,
		});

		if (!retriedDocument) {
			throw new HTTPError({
				message: DocumentErrorMessage.RETRY_NOT_ALLOWED,
				status: HTTPCode.CONFLICT,
			});
		}

		this.scheduleProcessing(id);

		return this.toManualTextResponse(retriedDocument);
	}
}

export { DocumentService };
