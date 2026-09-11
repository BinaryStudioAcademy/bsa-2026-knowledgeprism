import { DocumentStatus } from "@knowledgeprism/constants";
import {
	type DocumentConfirmUploadResponseDto,
	type DocumentConfirmUploadRouteParametersDto,
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentResponseDto,
	type DocumentUploadIntentRouteParametersDto,
} from "@knowledgeprism/types";

import { type Database } from "~/infrastructure/database/database.js";
import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "~/infrastructure/s3/libs/helpers/helpers.js";
import {
	type FetchDocumentObjectBytes,
	type GeneratePresignedUploadUrl,
} from "~/infrastructure/s3/libs/types/types.js";
import {
	buildDocumentStorageKey,
	parsePdfDocumentIntoBlocks,
	type PdfPageBlock,
} from "~/modules/documents/libs/helpers/helpers.js";
import { DocumentBlockEntity } from "~/modules/documents/models/document-block.entity.js";
import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentBlockRepository } from "~/modules/documents/repositories/document-block.repository.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

const EMPTY_LENGTH = 0;

class DocumentService {
	private documentBlockRepository: DocumentBlockRepository;

	private documentRepository: DocumentRepository;

	private fetchDocumentObjectBytes: FetchDocumentObjectBytes;

	private generatePresignedUploadUrl: GeneratePresignedUploadUrl;

	private logger: Logger;

	private runInTransaction: Database["transaction"];

	public constructor({
		documentBlockRepository,
		documentRepository,
		fetchDocumentObjectBytes,
		generatePresignedUploadUrl,
		logger,
		runInTransaction,
	}: {
		documentBlockRepository: DocumentBlockRepository;
		documentRepository: DocumentRepository;
		fetchDocumentObjectBytes: FetchDocumentObjectBytes;
		generatePresignedUploadUrl: GeneratePresignedUploadUrl;
		logger: Logger;
		runInTransaction: Database["transaction"];
	}) {
		this.documentBlockRepository = documentBlockRepository;
		this.documentRepository = documentRepository;
		this.fetchDocumentObjectBytes = fetchDocumentObjectBytes;
		this.generatePresignedUploadUrl = generatePresignedUploadUrl;
		this.logger = logger;
		this.runInTransaction = runInTransaction;
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

		let bytes: Uint8Array;

		try {
			bytes = await this.fetchDocumentObjectBytes({
				key: documentObject.s3Key,
			});
		} catch (error) {
			return await this.failAndThrow(
				documentId,
				"Failed to fetch document from S3.",
				error,
			);
		}

		let pages: PdfPageBlock[];

		try {
			pages = await parsePdfDocumentIntoBlocks(bytes);

			if (pages.length === EMPTY_LENGTH) {
				throw new Error("Parsed PDF has no pages.");
			}
		} catch (error) {
			return await this.failAndThrow(
				documentId,
				"Failed to parse PDF document.",
				error,
			);
		}

		try {
			await this.runInTransaction(async (transaction) => {
				await this.documentBlockRepository.createMany(
					pages.map((page) =>
						DocumentBlockEntity.initializeNew({
							content: page.content,
							documentId,
							pageNumber: page.pageNumber,
						}),
					),
					transaction,
				);

				await this.documentRepository.updateStatus(
					{ id: documentId, status: DocumentStatus.PARSED },
					transaction,
				);
			});
		} catch (error) {
			return await this.failAndThrow(
				documentId,
				"Failed to persist parsed document blocks.",
				error,
			);
		}

		return {
			blocksCount: pages.length,
			documentId,
			status: DocumentStatus.PARSED,
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
