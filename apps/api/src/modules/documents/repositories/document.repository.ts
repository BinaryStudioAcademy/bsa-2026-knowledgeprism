import { type DocumentStatus } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentModel } from "~/modules/documents/models/document.model.js";
import { type Repository } from "~/shared/types/types.js";

class DocumentRepository implements Pick<Repository<DocumentEntity>, "create"> {
	private documentModel: typeof DocumentModel;

	public constructor(documentModel: typeof DocumentModel) {
		this.documentModel = documentModel;
	}

	public async create(entity: DocumentEntity): Promise<DocumentEntity> {
		const {
			mimeType,
			name,
			projectId,
			s3Key,
			sizeInBytes,
			status,
			uploadedBy,
		} = entity.toNewObject();

		const document = await this.documentModel
			.query()
			.insert({
				mimeType,
				name,
				projectId,
				s3Key,
				sizeInBytes,
				status,
				uploadedBy,
			})
			.returning("*")
			.execute();

		return DocumentEntity.initialize(document);
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
}

export { DocumentRepository };
