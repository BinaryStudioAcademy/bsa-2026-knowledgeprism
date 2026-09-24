import { DocumentStatus } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
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
			id,
			processingAttempt,
			status,
		}: {
			errorMessage: null | string;
			expectedStatus: ValueOf<typeof DocumentStatus>;
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
			.where({ status: DocumentStatus.PROCESSING })
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

	public async findByIdAndProjectId({
		id,
		projectId,
	}: {
		id: number;
		projectId: number;
	}): Promise<DocumentEntity | null> {
		const document = await this.documentModel
			.query()
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

	public async startProcessing({
		allowedStatuses,
		id,
	}: {
		allowedStatuses: ValueOf<typeof DocumentStatus>[];
		id: number;
	}): Promise<null | { attempt: number; document: DocumentEntity }> {
		const document = await this.documentModel
			.query()
			.patch({
				errorMessage: null,
				processingAttempt: raw(NEXT_PROCESSING_ATTEMPT_SQL),
				status: DocumentStatus.PROCESSING,
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
