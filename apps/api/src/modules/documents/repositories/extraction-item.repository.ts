import { ExtractionItemStatus } from "@knowledgeprism/constants";
import { type Transaction } from "objection";

import { ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { type ExtractionItemModel } from "~/modules/documents/models/extraction-item.model.js";

type NewExtractionItem = {
	confidence: number;
	rationale: string;
	sourceExcerpt: string;
	sourcePageNumber: number;
	text: string;
	title: string;
};

const EMPTY_LENGTH = 0;

const toEntity = (item: ExtractionItemModel): ExtractionItemEntity =>
	ExtractionItemEntity.initialize({
		confidence: item.confidence,
		documentId: item.documentId,
		id: item.id,
		knowledgeNodeId: item.knowledgeNodeId,
		rationale: item.rationale,
		sourceExcerpt: item.sourceExcerpt,
		sourcePageNumber: item.sourcePageNumber,
		status: item.status,
		text: item.text,
		title: item.title,
	});

class ExtractionItemRepository {
	private extractionItemModel: typeof ExtractionItemModel;

	public constructor(extractionItemModel: typeof ExtractionItemModel) {
		this.extractionItemModel = extractionItemModel;
	}

	public async findByDocumentId(
		documentId: number,
	): Promise<ExtractionItemEntity[]> {
		const items = await this.extractionItemModel
			.query()
			.where({ documentId })
			.orderBy("sourcePageNumber", "asc")
			.orderBy("id", "asc")
			.execute();

		return items.map((item) => toEntity(item));
	}

	public async markApproved(
		{ id, knowledgeNodeId }: { id: number; knowledgeNodeId: number },
		transaction: Transaction,
	): Promise<void> {
		await this.extractionItemModel
			.query(transaction)
			.patch({ knowledgeNodeId, status: ExtractionItemStatus.APPROVED })
			.where({ id })
			.execute();
	}

	public async markRejected(
		ids: number[],
		transaction: Transaction,
	): Promise<void> {
		if (ids.length === EMPTY_LENGTH) {
			return;
		}

		await this.extractionItemModel
			.query(transaction)
			.patch({ status: ExtractionItemStatus.REJECTED })
			.whereIn("id", ids)
			.execute();
	}

	public async replacePending(
		{ documentId, items }: { documentId: number; items: NewExtractionItem[] },
		transaction: Transaction,
	): Promise<void> {
		await this.extractionItemModel
			.query(transaction)
			.delete()
			.where({ documentId, status: ExtractionItemStatus.PENDING })
			.execute();

		if (items.length === EMPTY_LENGTH) {
			return;
		}

		await this.extractionItemModel
			.query(transaction)
			.insert(
				items.map((item) => ({
					...item,
					documentId,
					status: ExtractionItemStatus.PENDING,
				})),
			)
			.execute();
	}
}

export { ExtractionItemRepository };
