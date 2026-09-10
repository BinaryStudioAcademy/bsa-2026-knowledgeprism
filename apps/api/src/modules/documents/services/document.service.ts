import { DocumentStatus } from "@knowledgeprism/constants";
import {
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentResponseDto,
	type DocumentUploadIntentRouteParametersDto,
} from "@knowledgeprism/types";

import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { type GeneratePresignedUploadUrl } from "~/infrastructure/s3/libs/types/types.js";
import { buildDocumentStorageKey } from "~/modules/documents/libs/helpers/helpers.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

class DocumentService {
	private documentRepository: DocumentRepository;

	private generatePresignedUploadUrl: GeneratePresignedUploadUrl;

	private logger: Logger;

	public constructor({
		documentRepository,
		generatePresignedUploadUrl,
		logger,
	}: {
		documentRepository: DocumentRepository;
		generatePresignedUploadUrl: GeneratePresignedUploadUrl;
		logger: Logger;
	}) {
		this.documentRepository = documentRepository;
		this.generatePresignedUploadUrl = generatePresignedUploadUrl;
		this.logger = logger;
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
