import {
	DocumentProcessingPhase,
	DocumentStatus,
} from "@knowledgeprism/constants";
import {
	type DocumentProcessingProgressDto,
	type ValueOf,
} from "@knowledgeprism/types";
import { raw, type Transaction } from "objection";

import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentModel } from "~/modules/documents/models/document.model.js";
import { type Repository } from "~/shared/types/types.js";

const NEXT_PROCESSING_ATTEMPT_SQL = "processing_attempt + 1";

class DocumentRepository implements Pick<Repository<DocumentEntity>, "create"> {
	private documentModel: typeof DocumentModel;

	public constructor(documentModel: typeof DocumentModel) {
		this.documentModel = documentModel;
	}

	public async compareAndSwapStatus(
		{
			errorMessage,
			expectedStatus,
			failedPageNumbers,
			id,
			processingAttempt,
			status,
		}: {
			errorMessage: null | string;
			expectedStatus: ValueOf<typeof DocumentStatus>;
			failedPageNumbers?: number[];
			id: number;
			processingAttempt?: number;
			status: ValueOf<typeof DocumentStatus>;
		},
		transaction?: Transaction,
	): Promise<DocumentEntity | null> {
		const document = await this.documentModel
			.query(transaction)
			.patch({
				errorMessage,
				...(failedPageNumbers !== undefined && { failedPageNumbers }),
				status,
			})
			.where({
				id,
				status: expectedStatus,
				...(processingAttempt !== undefined && { processingAttempt }),
			})
			.returning("*")
			.first();

		if (!document) {
			return null;
		}

		return DocumentEntity.initialize(document);
	}

	public async create(entity: DocumentEntity): Promise<DocumentEntity> {
		const payload = entity.toNewObject();
		const document = await this.documentModel
			.query()
			.insert(payload)
			.returning("*")
			.execute();

		return DocumentEntity.initialize(document);
	}

	public async failStaleProcessing({
		errorMessage,
		updatedBefore,
	}: {
		errorMessage: string;
		updatedBefore: Date;
	}): Promise<number> {
		return await this.documentModel
			.query()
			.patch({ errorMessage, status: DocumentStatus.FAILED })
			.whereIn("status", [
				DocumentStatus.INTEGRATING,
				DocumentStatus.PROCESSING,
			])
			.where("updatedAt", "<", updatedBefore)
			.execute();
	}

	public async findById(
		id: number,
		transaction?: Transaction,
	): Promise<DocumentEntity | null> {
		const document = await this.documentModel
			.query(transaction)
			.findById(id)
			.execute();

		return document ? DocumentEntity.initialize(document) : null;
	}

	public async findByIdAndProjectId(
		{
			id,
			projectId,
		}: {
			id: number;
			projectId: number;
		},
		{
			forUpdate = false,
			transaction,
		}: {
			forUpdate?: boolean;
			transaction?: Transaction;
		} = {},
	): Promise<DocumentEntity | null> {
		let query = this.documentModel.query(transaction);

		if (forUpdate) {
			query = query.forUpdate();
		}

		const document = await query
			.findOne({
				id,
				projectId,
			})
			.execute();

		if (!document) {
			return null;
		}

		return DocumentEntity.initialize(document);
	}

	public async findByProjectIdAndStatuses({
		projectId,
		statuses,
	}: {
		projectId: number;
		statuses: ValueOf<typeof DocumentStatus>[];
	}): Promise<DocumentEntity[]> {
		const documents = await this.documentModel
			.query()
			.where({ projectId })
			.whereIn("status", statuses)
			.orderBy("updatedAt", "asc")
			.execute();

		return documents.map((document) => DocumentEntity.initialize(document));
	}

	public async findByStatuses(
		statuses: ValueOf<typeof DocumentStatus>[],
	): Promise<DocumentEntity[]> {
		const documents = await this.documentModel
			.query()
			.whereIn("status", statuses)
			.orderBy("updatedAt", "asc")
			.execute();

		return documents.map((document) => DocumentEntity.initialize(document));
	}

	public async findProcessingByHash({
		contentHash,
		projectId,
		uploadedBy,
	}: {
		contentHash: string;
		projectId: number;
		uploadedBy: number;
	}): Promise<DocumentEntity | null> {
		const document = await this.documentModel
			.query()
			.findOne({
				contentHash,
				projectId,
				status: DocumentStatus.PROCESSING,
				uploadedBy,
			})
			.execute();

		if (!document) {
			return null;
		}

		return DocumentEntity.initialize(document);
	}

	public async startProcessing(
		{
			allowedStatuses,
			id,
			status,
		}: {
			allowedStatuses: ValueOf<typeof DocumentStatus>[];
			id: number;
			status: ValueOf<typeof DocumentStatus>;
		},
		transaction?: Transaction,
	): Promise<null | { attempt: number; document: DocumentEntity }> {
		const document = await this.documentModel
			.query(transaction)
			.patch({
				errorMessage: null,
				...(status === DocumentStatus.PROCESSING && { failedPageNumbers: [] }),
				processingAttempt: raw(NEXT_PROCESSING_ATTEMPT_SQL),
				processingProgress: {
					failedUnits: 0,
					phase:
						status === DocumentStatus.INTEGRATING
							? DocumentProcessingPhase.INTEGRATING
							: DocumentProcessingPhase.READING,
					processedUnits: 0,
					totalUnits: null,
				},
				status,
			})
			.where({ id })
			.whereIn("status", allowedStatuses)
			.returning("*")
			.first();

		if (!document) {
			return null;
		}

		return {
			attempt: document.processingAttempt,
			document: DocumentEntity.initialize(document),
		};
	}

	public async touchProcessingAttempt({
		expectedStatus,
		id,
		processingAttempt,
	}: {
		expectedStatus: ValueOf<typeof DocumentStatus>;
		id: number;
		processingAttempt: number;
	}): Promise<boolean> {
		const updatedCount = await this.documentModel
			.query()
			.patch({ updatedAt: new Date() })
			.where({
				id,
				processingAttempt,
				status: expectedStatus,
			})
			.execute();

		return Boolean(updatedCount);
	}

	public async updateProcessingProgress({
		id,
		processingAttempt,
		progress,
		status,
	}: {
		id: number;
		processingAttempt: number;
		progress: DocumentProcessingProgressDto;
		status: ValueOf<typeof DocumentStatus>;
	}): Promise<boolean> {
		const updatedCount = await this.documentModel
			.query()
			.patch({ processingProgress: progress })
			.where({ id, processingAttempt, status })
			.where((query) => {
				query
					.where((continuing) => {
						continuing
							.where((phase) => {
								phase
									.whereNull("processingProgress")
									.orWhereJsonPath(
										"processingProgress",
										"$.phase",
										"=",
										progress.phase,
									)
									.orWhereJsonPath(
										"processingProgress",
										"$.phase",
										"=",
										DocumentProcessingPhase.READING,
									);
							})
							.whereRaw(
								"COALESCE((processing_progress->>'processedUnits')::integer, 0) <= ?",
								[progress.processedUnits],
							);
					})
					.orWhere((extractionToIntegration) => {
						extractionToIntegration
							.whereJsonPath(
								"processingProgress",
								"$.phase",
								"=",
								DocumentProcessingPhase.EXTRACTING,
							)
							.whereRaw("? = ?", [
								progress.phase,
								DocumentProcessingPhase.INTEGRATING,
							]);
					});
			})
			.execute();
		return Boolean(updatedCount);
	}

	public async updateStatus(
		{ id, status }: { id: number; status: ValueOf<typeof DocumentStatus> },
		transaction?: Transaction,
	): Promise<DocumentEntity> {
		const document = await this.documentModel
			.query(transaction)
			.patchAndFetchById(id, { status })
			.execute();

		return DocumentEntity.initialize(document);
	}

	public async updateStatusIfCurrentIn({
		allowedStatuses,
		errorMessage,
		id,
		status,
	}: {
		allowedStatuses: ValueOf<typeof DocumentStatus>[];
		errorMessage: null | string;
		id: number;
		status: ValueOf<typeof DocumentStatus>;
	}): Promise<DocumentEntity | null> {
		const document = await this.documentModel
			.query()
			.patch({
				errorMessage,
				status,
			})
			.where({
				id,
			})
			.whereIn("status", allowedStatuses)
			.returning("*")
			.first();

		if (!document) {
			return null;
		}

		return DocumentEntity.initialize(document);
	}
}

export { DocumentRepository };
