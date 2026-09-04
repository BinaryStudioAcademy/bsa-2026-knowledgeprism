import { type S3Client } from "@aws-sdk/client-s3";
import { DocumentStatus } from "@knowledgeprism/constants";
import {
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentResponseDto,
	type DocumentUploadIntentRouteParametersDto,
} from "@knowledgeprism/types";

import { type Config } from "~/infrastructure/config/config.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import {
	createPresignedUploadUrl,
	PRESIGNED_URL_EXPIRY_SECONDS,
} from "~/infrastructure/s3/libs/helpers/helpers.js";
import { buildDocumentStorageKey } from "~/modules/documents/libs/helpers/helpers.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

class DocumentService {
	private config: Config;

	private documentRepository: DocumentRepository;

	private logger: Logger;

	private s3Client: S3Client;

	public constructor({
		config,
		documentRepository,
		logger,
		s3Client,
	}: {
		config: Config;
		documentRepository: DocumentRepository;
		logger: Logger;
		s3Client: S3Client;
	}) {
		this.config = config;
		this.documentRepository = documentRepository;
		this.logger = logger;
		this.s3Client = s3Client;
	}

	public async createUploadIntent({
		payload,
		routeParameters,
	}: {
		payload: DocumentUploadIntentRequestDto;
		routeParameters: DocumentUploadIntentRouteParametersDto;
	}): Promise<DocumentUploadIntentResponseDto> {
		const bucketName = this.config.ENV.AWS.S3_BUCKET_NAME;
		const storageKey = buildDocumentStorageKey({
			fileName: payload.fileName,
			projectId: routeParameters.projectId,
		});

		let uploadUrl: string;

		try {
			uploadUrl = await createPresignedUploadUrl({
				bucketName,
				contentType: payload.contentType,
				key: storageKey,
				s3Client: this.s3Client,
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
