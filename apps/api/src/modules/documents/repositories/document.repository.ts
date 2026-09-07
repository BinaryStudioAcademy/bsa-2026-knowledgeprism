import { DocumentStatus } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentModel } from "~/modules/documents/models/document.model.js";

class DocumentRepository {
	private documentModel: typeof DocumentModel;

	public constructor(documentModel: typeof DocumentModel) {
		this.documentModel = documentModel;
	}

	public async compareAndSwapStatus({
		errorMessage,
		expectedStatus,
		id,
		status,
	}: {
		errorMessage: null | string;
		expectedStatus: ValueOf<typeof DocumentStatus>;
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
				status: expectedStatus,
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
		createdByUserId,
		projectId,
	}: {
		contentHash: string;
		createdByUserId: number;
		projectId: number;
	}): Promise<DocumentEntity | null> {
		const document = await this.documentModel
			.query()
			.findOne({
				contentHash,
				createdByUserId,
				projectId,
				status: DocumentStatus.PROCESSING,
			})
			.execute();

		if (!document) {
			return null;
		}

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
