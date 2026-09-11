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
}

export { DocumentRepository };
