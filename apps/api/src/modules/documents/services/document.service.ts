import { DocumentStatus } from "@knowledgeprism/constants";
import {
	type DocumentConfirmUploadResponseDto,
	type DocumentConfirmUploadRouteParametersDto,
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentResponseDto,
	type DocumentUploadIntentRouteParametersDto,
} from "@knowledgeprism/types";

import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "~/infrastructure/s3/libs/helpers/helpers.js";
import {
	type CheckDocumentObjectExists,
	type GeneratePresignedUploadUrl,
} from "~/infrastructure/s3/libs/types/types.js";
import { buildDocumentStorageKey } from "~/modules/documents/libs/helpers/helpers.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

class DocumentService {
	private checkDocumentObjectExists: CheckDocumentObjectExists;

	private documentRepository: DocumentRepository;

	private generatePresignedUploadUrl: GeneratePresignedUploadUrl;

	private logger: Logger;

	public constructor({
		checkDocumentObjectExists,
		documentRepository,
		generatePresignedUploadUrl,
		logger,
	}: {
		checkDocumentObjectExists: CheckDocumentObjectExists;
		documentRepository: DocumentRepository;
		generatePresignedUploadUrl: GeneratePresignedUploadUrl;
		logger: Logger;
	}) {
		this.checkDocumentObjectExists = checkDocumentObjectExists;
		this.documentRepository = documentRepository;
		this.generatePresignedUploadUrl = generatePresignedUploadUrl;
		this.logger = logger;
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

	public async confirmUpload({
		routeParameters,
	}: {
		routeParameters: DocumentConfirmUploadRouteParametersDto;
	}): Promise<DocumentConfirmUploadResponseDto> {
		const documentId = Number(routeParameters.documentId);
		const document = await this.documentRepository.findById(documentId);
		const documentObject = document?.toObject();

		if (
			!documentObject ||
			documentObject.projectId !== routeParameters.projectId
		) {
			throw new HTTPError({
				message: "Document not found.",
				status: HTTPCode.NOT_FOUND,
			});
		}

		if (documentObject.status !== DocumentStatus.UPLOADED) {
			throw new HTTPError({
				message: `Document cannot be confirmed from status "${documentObject.status}".`,
				status: HTTPCode.CONFLICT,
			});
		}

		await this.documentRepository.updateStatus({
			id: documentId,
			status: DocumentStatus.PROCESSING,
		});

		let isObjectPresent: boolean;

		try {
			isObjectPresent = await this.checkDocumentObjectExists({
				key: documentObject.s3Key,
			});
		} catch (error) {
			return await this.failAndThrow(
				documentId,
				"Failed to verify uploaded document in S3.",
				error,
			);
		}

		if (!isObjectPresent) {
			return await this.failAndThrow(
				documentId,
				"Uploaded document was not found in S3.",
				new Error("S3 object missing"),
			);
		}

		const confirmedDocument = await this.documentRepository.updateStatus({
			id: documentId,
			status: DocumentStatus.PARSED,
		});

		return {
			documentId,
			status: confirmedDocument.toObject().status,
		};
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
					mimeType: payload.contentType,
					name: payload.fileName,
					projectId: routeParameters.projectId,
					s3Key: storageKey,
					sizeInBytes: payload.sizeInBytes ?? null,
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
}

export { DocumentService };
