import {
	DocumentErrorMessage,
	DocumentSourceType,
	DocumentStatus,
	DocumentValidationRule,
	ProjectValidationMessage,
} from "@knowledgeprism/constants";
import {
	type DocumentConfirmUploadResponseDto,
	type DocumentConfirmUploadRouteParametersDto,
	type DocumentStatusResponseDto,
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentResponseDto,
	type DocumentUploadIntentRouteParametersDto,
	type ManualTextCreateRequestDto,
	type ManualTextResponseDto,
} from "@knowledgeprism/types";
import { ForeignKeyViolationError } from "objection";

import { DatabaseConstraintName } from "~/infrastructure/database/libs/enums/database-constraint-name.enum.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { type GeneratePresignedUploadUrl } from "~/infrastructure/s3/libs/types/types.js";
import { type CheckDocumentObjectExists } from "~/infrastructure/s3/verify-object.js";
import { ProcessingSweep } from "~/modules/documents/libs/constants/processing-sweep.constant.js";
import { createContentHash } from "~/modules/documents/libs/helpers/create-content-hash.helper.js";
import { buildDocumentStorageKey } from "~/modules/documents/libs/helpers/helpers.js";
import { isUniqueViolation } from "~/modules/documents/libs/helpers/is-unique-violation.helper.js";
import { toDocumentStatusResponse } from "~/modules/documents/libs/helpers/to-document-status-response.helper.js";
import { type ProcessingAttempt } from "~/modules/documents/libs/types/processing-attempt.type.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

import { type DocumentProcessor } from "./document-processor.js";
import { type DocumentReference } from "./document-review.service.js";

const MANUAL_TEXT_MIME_TYPE = "text/plain";
const UNTITLED_MANUAL_DOCUMENT_NAME = "Untitled";
const NO_DOCUMENTS = 0;
const INITIAL_PROCESSING_ATTEMPT = 0;

type Constructor = {
	checkDocumentObjectExists: CheckDocumentObjectExists;
	documentProcessor: DocumentProcessor;
	documentRepository: DocumentRepository;
	generatePresignedUploadUrl: GeneratePresignedUploadUrl;
	logger: Logger;
	projectService: ProjectService;
};

const createRetryNotAllowedError = (): HTTPError => {
	return new HTTPError({
		message: DocumentErrorMessage.RETRY_NOT_ALLOWED,
		status: HTTPCode.CONFLICT,
	});
};

class DocumentService {
	private checkDocumentObjectExists: CheckDocumentObjectExists;

	private documentProcessor: DocumentProcessor;

	private documentRepository: DocumentRepository;

	private generatePresignedUploadUrl: GeneratePresignedUploadUrl;

	private logger: Logger;

	private projectService: ProjectService;

	public constructor({
		checkDocumentObjectExists,
		documentProcessor,
		documentRepository,
		generatePresignedUploadUrl,
		logger,
		projectService,
	}: Constructor) {
		this.checkDocumentObjectExists = checkDocumentObjectExists;
		this.documentProcessor = documentProcessor;
		this.documentRepository = documentRepository;
		this.generatePresignedUploadUrl = generatePresignedUploadUrl;
		this.logger = logger;
		this.projectService = projectService;
	}

	private async assertRetryableUpload(document: DocumentEntity): Promise<void> {
		const { s3Key, sourceType } = document.toObject();

		if (sourceType !== DocumentSourceType.UPLOAD) {
			return;
		}

		if (!s3Key) {
			throw createRetryNotAllowedError();
		}

		try {
			await this.verifyUploadedObject(s3Key);
		} catch (error) {
			if (error instanceof S3ObjectNotFoundError) {
				throw new HTTPError({
					cause: error,
					message: DocumentErrorMessage.UPLOAD_OBJECT_NOT_FOUND,
					status: HTTPCode.CONFLICT,
				});
			}

			if (error instanceof S3ObjectTooLargeError) {
				throw new HTTPError({
					cause: error,
					message: DocumentErrorMessage.UPLOAD_OBJECT_TOO_LARGE,
					status: HTTPCode.CONFLICT,
				});
			}

			throw new HTTPError({
				cause: error,
				message: DocumentErrorMessage.UPLOAD_VERIFICATION_FAILED,
				status: HTTPCode.SERVICE_UNAVAILABLE,
			});
		}
	}

	private async completeProcessing(
		processingAttempt: ProcessingAttempt,
	): Promise<void> {
		try {
			const isCompleted =
				await this.documentProcessor.process(processingAttempt);

			if (!isCompleted) {
				this.logger.warn(
					"Discarded results of a superseded processing attempt.",
					{ ...processingAttempt },
				);
			}
		} catch (error) {
			this.logger.error("Failed to process document.", {
				...processingAttempt,
				error,
			});

			await this.failProcessing(processingAttempt);
		}
	}

	private async failAndThrow(
		documentId: number,
		message: string,
		error: unknown,
	): Promise<never> {
		await this.documentRepository.updateStatus({
			id: documentId,
			status: DocumentStatus.FAILED,
		});

		this.logger.error(message, { documentId, error });

		throw new HTTPError({
			cause: error,
			message,
			status: HTTPCode.INTERNAL_SERVER_ERROR,
		});
	}

	private async failProcessing({
		attempt,
		documentId,
	}: ProcessingAttempt): Promise<void> {
		try {
			await this.documentRepository.compareAndSwapStatus({
				errorMessage: DocumentErrorMessage.PROCESSING_FAILED,
				expectedStatus: DocumentStatus.PROCESSING,
				id: documentId,
				processingAttempt: attempt,
				status: DocumentStatus.FAILED,
			});
		} catch (error) {
			this.logger.error("Failed to mark document as failed.", {
				documentId,
				error,
			});
		}
	}

	private async findOwnedDocument({
		id,
		projectId,
	}: {
		id: number;
		projectId: number;
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

	private async restartFailedProcessing(id: number): Promise<DocumentEntity> {
		const processing = await this.documentRepository.startProcessing({
			allowedStatuses: [DocumentStatus.FAILED],
			id,
		});

		if (!processing) {
			throw createRetryNotAllowedError();
		}

		this.scheduleProcessing({ attempt: processing.attempt, documentId: id });

		return processing.document;
	}

	private scheduleProcessing(processingAttempt: ProcessingAttempt): void {
		setImmediate(() => {
			void this.completeProcessing(processingAttempt);
		});
	}

	private toManualTextResponse(
		document: DocumentEntity,
	): ManualTextResponseDto {
		const documentDetails = document.toObject();

		return {
			createdAt: documentDetails.createdAt.toISOString(),
			errorMessage: documentDetails.errorMessage,
			id: documentDetails.id,
			projectId: documentDetails.projectId,
			sourceType: documentDetails.sourceType,
			status: documentDetails.status,
			title:
				documentDetails.name === UNTITLED_MANUAL_DOCUMENT_NAME
					? null
					: documentDetails.name,
			updatedAt: documentDetails.updatedAt.toISOString(),
		};
	}

	private async verifyUploadedObject(s3Key: string): Promise<void> {
		const objectSizeInBytes = await this.checkDocumentObjectExists({
			key: s3Key,
		});

		if (objectSizeInBytes === null) {
			throw new S3ObjectNotFoundError("S3 object missing");
		}

		if (objectSizeInBytes > DocumentValidationRule.MAXIMUM_FILE_SIZE_IN_BYTES) {
			throw new S3ObjectTooLargeError("S3 object exceeds maximum file size");
		}
	}

	public async cancelManualText({
		context,
		id,
		projectId,
	}: {
		context: ProjectAccessContext;
		id: number;
		projectId: string;
	}): Promise<ManualTextResponseDto> {
		const numericProjectId = Number(projectId);

		await this.projectService.assertCanWriteKnowledge(
			numericProjectId,
			context,
		);
		await this.findOwnedDocument({
			id,
			projectId: numericProjectId,
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

	public async confirmUpload({
		context,
		routeParameters,
	}: {
		context: ProjectAccessContext;
		routeParameters: DocumentConfirmUploadRouteParametersDto;
	}): Promise<DocumentConfirmUploadResponseDto> {
		const projectId = Number(routeParameters.projectId);

		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const { documentId } = routeParameters;
		const document = await this.documentRepository.findById(documentId);
		const documentDetails = document?.toObject();

		if (!documentDetails || documentDetails.projectId !== projectId) {
			throw new HTTPError({
				message: "Document not found.",
				status: HTTPCode.NOT_FOUND,
			});
		}

		const { s3Key } = documentDetails;

		if (!s3Key) {
			throw new HTTPError({
				message: "Document has no associated S3 object to confirm.",
				status: HTTPCode.CONFLICT,
			});
		}

		const processing = await this.documentRepository.startProcessing({
			allowedStatuses: [DocumentStatus.UPLOADED],
			id: documentObject.id,
		});

		if (!processing) {
			throw new HTTPError({
				message: DocumentErrorMessage.CONFIRM_NOT_ALLOWED,
				status: HTTPCode.CONFLICT,
			});
		}

		try {
			await this.verifyUploadedObject(s3Key);
		} catch (error) {
			if (error instanceof S3ObjectNotFoundError) {
				await this.failAndThrow(
					documentId,
					DocumentErrorMessage.UPLOAD_OBJECT_NOT_FOUND,
					error,
				);
			}

			if (error instanceof S3ObjectTooLargeError) {
				await this.failAndThrow(
					documentId,
					DocumentErrorMessage.UPLOAD_OBJECT_TOO_LARGE,
					error,
				);
			}

			await this.documentRepository.updateStatus({
				id: documentId,
				status: DocumentStatus.UPLOADED,
			});

			this.logger.error("Failed to verify uploaded document in S3.", {
				documentId,
				error,
			});

			throw new HTTPError({
				cause: error,
				message: DocumentErrorMessage.UPLOAD_VERIFICATION_FAILED,
				status: HTTPCode.SERVICE_UNAVAILABLE,
			});
		}

		this.scheduleProcessing({
			attempt: processing.attempt,
			documentId: documentObject.id,
		});

		return {
			documentId: documentObject.id,
			status: processing.document.toObject().status,
		};
	}

	public async createManualText({
		context,
		payload,
		projectId,
	}: {
		context: ProjectAccessContext;
		payload: ManualTextCreateRequestDto;
		projectId: string;
	}): Promise<ManualTextResponseDto> {
		const numericProjectId = Number(projectId);

		await this.projectService.assertCanWriteKnowledge(
			numericProjectId,
			context,
		);

		const title = this.normalizeTitle(payload.title);
		const contentHash = createContentHash(title, payload.content);
		const inFlightDocument = await this.documentRepository.findProcessingByHash(
			{
				contentHash,
				projectId: numericProjectId,
				uploadedBy: context.userId,
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
					projectId: numericProjectId,
					s3Key: null,
					sizeInBytes: null,
					sourceType: DocumentSourceType.MANUAL,
					status: DocumentStatus.PROCESSING,
					uploadedBy: context.userId,
				}),
			);
		} catch (error) {
			if (!isUniqueViolation(error)) {
				throw error;
			}

			const existingDocument =
				await this.documentRepository.findProcessingByHash({
					contentHash,
					projectId: numericProjectId,
					uploadedBy: context.userId,
				});

			if (!existingDocument) {
				throw error;
			}

			return this.toManualTextResponse(existingDocument);
		}

		const createdDocumentDto = this.toManualTextResponse(createdDocument);

		this.scheduleProcessing({
			attempt: INITIAL_PROCESSING_ATTEMPT,
			documentId: createdDocumentDto.id,
		});

		return createdDocumentDto;
	}

	public async createUploadIntent({
		context,
		payload,
		routeParameters,
	}: {
		context: ProjectAccessContext;
		payload: DocumentUploadIntentRequestDto;
		routeParameters: DocumentUploadIntentRouteParametersDto;
	}): Promise<DocumentUploadIntentResponseDto> {
		const projectId = Number(routeParameters.projectId);

		await this.projectService.assertCanWriteKnowledge(projectId, context);

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
					projectId,
					s3Key: storageKey,
					sizeInBytes: payload.sizeInBytes ?? null,
					sourceType: DocumentSourceType.UPLOAD,
					status: DocumentStatus.UPLOADED,
					uploadedBy: context.userId,
				}),
			);
		} catch (error) {
			if (
				error instanceof ForeignKeyViolationError &&
				error.constraint === DatabaseConstraintName.DOCUMENTS_PROJECT_ID_FOREIGN
			) {
				throw new HTTPError({
					cause: error,
					message: ProjectValidationMessage.NOT_FOUND,
					status: HTTPCode.NOT_FOUND,
				});
			}

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

		const documentDetails = document.toObject();

		return {
			documentId: documentDetails.id,
			expiresInSeconds: PRESIGNED_URL_EXPIRY_SECONDS,
			storageKey,
			uploadUrl,
		};
	}

	public async failStaleProcessing(): Promise<void> {
		try {
			const failedCount = await this.documentRepository.failStaleProcessing({
				errorMessage: DocumentErrorMessage.PROCESSING_INTERRUPTED,
				updatedBefore: new Date(Date.now() - ProcessingSweep.STALE_AFTER_MS),
			});

			if (failedCount > NO_DOCUMENTS) {
				this.logger.warn("Marked stale processing documents as failed.", {
					failedCount,
				});
			}
		} catch (error) {
			this.logger.error("Failed to sweep stale processing documents.", {
				error,
			});
		}
	}

	public async findManualText({
		context,
		id,
		projectId,
	}: {
		context: ProjectAccessContext;
		id: number;
		projectId: string;
	}): Promise<ManualTextResponseDto> {
		const numericProjectId = Number(projectId);

		await this.projectService.assertProjectAccess(numericProjectId, context);

		const document = await this.findOwnedDocument({
			id,
			projectId: numericProjectId,
		});

		return this.toManualTextResponse(document);
	}

	public async retryManualText({
		context,
		id,
		projectId,
	}: {
		context: ProjectAccessContext;
		id: number;
		projectId: string;
	}): Promise<ManualTextResponseDto> {
		const numericProjectId = Number(projectId);

		await this.projectService.assertCanWriteKnowledge(
			numericProjectId,
			context,
		);

		const document = await this.findOwnedDocument({
			id,
			projectId: numericProjectId,
		});

		if (document.toObject().sourceType !== DocumentSourceType.MANUAL) {
			throw new HTTPError({
				message: DocumentErrorMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		const retriedDocument = await this.restartFailedProcessing(id);

		return this.toManualTextResponse(retriedDocument);
	}

	public async retryProcessing({
		context,
		documentId,
		projectId,
	}: DocumentReference): Promise<DocumentStatusResponseDto> {
		await this.projectService.assertCanWriteKnowledge(projectId, context);

		const document = await this.findOwnedDocument({
			id: documentId,
			projectId,
		});

		if (document.toObject().status !== DocumentStatus.FAILED) {
			throw createRetryNotAllowedError();
		}

		await this.assertRetryableUpload(document);

		const retriedDocument = await this.restartFailedProcessing(documentId);

		return toDocumentStatusResponse(retriedDocument);
	}
}

class S3ObjectNotFoundError extends Error {}

class S3ObjectTooLargeError extends Error {}

export { DocumentService };
