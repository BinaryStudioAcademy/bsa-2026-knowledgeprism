import { type Transaction } from "objection";

import { DocumentBlockEntity } from "~/modules/documents/models/document-block.entity.js";
import { type DocumentBlockModel } from "~/modules/documents/models/document-block.model.js";
import { type Repository } from "~/shared/types/types.js";

const EMPTY_LENGTH = 0;

class DocumentBlockRepository implements Pick<
	Repository<DocumentBlockEntity>,
	"create"
> {
	private documentBlockModel: typeof DocumentBlockModel;

	public constructor(documentBlockModel: typeof DocumentBlockModel) {
		this.documentBlockModel = documentBlockModel;
	}

	public async create(
		entity: DocumentBlockEntity,
		transaction?: Transaction,
	): Promise<DocumentBlockEntity> {
		const block = await this.documentBlockModel
			.query(transaction)
			.insert(entity.toNewObject())
			.returning("*")
			.execute();

		return DocumentBlockEntity.initialize(block);
	}

	public async createMany(
		entities: DocumentBlockEntity[],
		transaction?: Transaction,
	): Promise<DocumentBlockEntity[]> {
		if (entities.length === EMPTY_LENGTH) {
			return [];
		}

		const blocks = await this.documentBlockModel
			.query(transaction)
			.insert(entities.map((entity) => entity.toNewObject()))
			.returning("*")
			.execute();

		return blocks.map((block) => DocumentBlockEntity.initialize(block));
	}
}

export { DocumentBlockRepository };
