import {
	DocumentErrorMessage,
	DocumentStatus,
	HTTPCode,
} from "@knowledgeprism/constants";
import {
	type ManualTextCreateRequestDto,
	type ManualTextResponseDto,
} from "@knowledgeprism/types";

import { HTTPError } from "~/infrastructure/http/http.js";
import { createContentHash } from "~/modules/documents/libs/helpers/create-content-hash.helper.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

import { DocumentEntity } from "../models/document.entity.js";
import { type DocumentAccessService } from "./document-access.service.js";
import { type DocumentProcessor } from "./document-processor.js";

type Constructor = {
	documentAccessService: DocumentAccessService;
	documentProcessor: DocumentProcessor;
	documentRepository: DocumentRepository;
};

class DocumentService {
	private documentAccessService: DocumentAccessService;

	private documentProcessor: DocumentProcessor;

	private documentRepository: DocumentRepository;

	public constructor({
		documentAccessService,
		documentProcessor,
		documentRepository,
	}: Constructor) {
		this.documentAccessService = documentAccessService;
		this.documentProcessor = documentProcessor;
		this.documentRepository = documentRepository;
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

	private scheduleProcessing(id: number): void {
		setImmediate(() => {
			void this.completeProcessing(id);
		});
	}

	public async cancelManualText({
		id,
		projectId,
		userId,
	}: {
		id: number;
		projectId: number;
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

		return cancelledDocument.toObject();
	}

	public async createManualText({
		payload,
		projectId,
		userId,
	}: {
		payload: ManualTextCreateRequestDto;
		projectId: number;
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
				createdByUserId: userId,
				projectId,
			},
		);

		if (inFlightDocument) {
			return inFlightDocument.toObject();
		}

		const createdDocument = await this.documentRepository.create(
			DocumentEntity.initializeNew({
				content: payload.content,
				contentHash,
				createdByUserId: userId,
				projectId,
				title,
			}),
		);
		const createdDocumentDto = createdDocument.toObject();

		this.scheduleProcessing(createdDocumentDto.id);

		return createdDocumentDto;
	}

	public async findManualText({
		id,
		projectId,
		userId,
	}: {
		id: number;
		projectId: number;
		userId: number;
	}): Promise<ManualTextResponseDto> {
		await this.documentAccessService.assertCanAddKnowledge({
			projectId,
			userId,
		});
		const document = await this.findOwnedDocument({
			id,
			projectId,
		});

		return document.toObject();
	}

	public async retryManualText({
		id,
		projectId,
		userId,
	}: {
		id: number;
		projectId: number;
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

		return retriedDocument.toObject();
	}
}

export { DocumentService };
