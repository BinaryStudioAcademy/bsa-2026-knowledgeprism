import {
	DocumentStatus,
	ProjectValidationMessage,
} from "@knowledgeprism/constants";
import {
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentResponseDto,
	type DocumentUploadIntentRouteParametersDto,
} from "@knowledgeprism/types";
import { ForeignKeyViolationError } from "objection";

import { DatabaseConstraintName } from "~/infrastructure/database/libs/enums/database-constraint-name.enum.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { type GeneratePresignedUploadUrl } from "~/infrastructure/s3/libs/types/types.js";
import { buildDocumentStorageKey } from "~/modules/documents/libs/helpers/helpers.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import {
	type ProjectAccessContext,
	type ProjectService,
} from "~/modules/projects/services/project.service.js";

class DocumentService {
	private documentRepository: DocumentRepository;

	private generatePresignedUploadUrl: GeneratePresignedUploadUrl;

	private logger: Logger;

	private projectService: ProjectService;

	public constructor({
		documentRepository,
		generatePresignedUploadUrl,
		logger,
		projectService,
	}: {
		documentRepository: DocumentRepository;
		generatePresignedUploadUrl: GeneratePresignedUploadUrl;
		logger: Logger;
		projectService: ProjectService;
	}) {
		this.documentRepository = documentRepository;
		this.generatePresignedUploadUrl = generatePresignedUploadUrl;
		this.logger = logger;
		this.projectService = projectService;
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

		await this.projectService.assertCanAddKnowledge(projectId, context);

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
					projectId,
					s3Key: storageKey,
					sizeInBytes: payload.sizeInBytes ?? null,
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
