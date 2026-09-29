import { ExtractionItemStatus } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { ExtractionItemEntity } from "~/modules/documents/models/extraction-item.entity.js";
import { type ExtractionItemModel } from "~/modules/documents/models/extraction-item.model.js";

type NewExtractionItem = {
	confidence: number;
	extractionSectionId?: null | number;
	position?: number;
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
		extractionSectionId: item.extractionSectionId,
		id: item.id,
		knowledgeNodeId: item.knowledgeNodeId,
		position: item.position,
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

	private async updateStatus(
		{
			ids,
			status,
		}: { ids: number[]; status: ValueOf<typeof ExtractionItemStatus> },
		transaction: Transaction,
	): Promise<void> {
		if (ids.length === EMPTY_LENGTH) {
			return;
		}

		await this.extractionItemModel
			.query(transaction)
			.patch({ status })
			.whereIn("id", ids)
			.execute();
	}

	public async findByDocumentId(
		documentId: number,
		transaction?: Transaction,
	): Promise<ExtractionItemEntity[]> {
		const items = await this.extractionItemModel
			.query(transaction)
			.select("extraction_items.*")
			.leftJoin(
				"extraction_sections",
				"extraction_items.extraction_section_id",
				"extraction_sections.id",
			)
			.where({ documentId })
			.orderByRaw("extraction_sections.position asc nulls last")
			.orderBy("extraction_items.position", "asc")
			.orderBy("extraction_items.sourcePageNumber", "asc")
			.orderBy("extraction_items.id", "asc")
			.execute();

		return items.map((item) => toEntity(item));
	}

	public async findById(
		id: number,
		transaction?: Transaction,
	): Promise<ExtractionItemEntity | null> {
		const item = await this.extractionItemModel
			.query(transaction)
			.findById(id)
			.execute();

		return item ? toEntity(item) : null;
	}

	public async insertManyPending(
		{ documentId, items }: { documentId: number; items: NewExtractionItem[] },
		transaction: Transaction,
	): Promise<ExtractionItemEntity[]> {
		if (items.length === EMPTY_LENGTH) {
			return [];
		}

		const inserted = await this.extractionItemModel
			.query(transaction)
			.insert(
				items.map((item) => ({
					...item,
					documentId,
					status: ExtractionItemStatus.PENDING,
				})),
			)
			.returning("*")
			.execute();

		return inserted.map((item) => toEntity(item));
	}

	public async linkKnowledgeNode(
		{ id, knowledgeNodeId }: { id: number; knowledgeNodeId: number },
		transaction: Transaction,
	): Promise<void> {
		await this.extractionItemModel
			.query(transaction)
			.patch({ knowledgeNodeId })
			.where({ id })
			.execute();
	}

	public async markApproved(
		ids: number[],
		transaction: Transaction,
	): Promise<void> {
		await this.updateStatus(
			{ ids, status: ExtractionItemStatus.APPROVED },
			transaction,
		);
	}

	public async markRejected(
		ids: number[],
		transaction: Transaction,
	): Promise<void> {
		await this.updateStatus(
			{ ids, status: ExtractionItemStatus.REJECTED },
			transaction,
		);
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

	public async updatePendingContent(
		{
			documentId,
			id,
			payload,
		}: {
			documentId: number;
			id: number;
			payload: { text: string; title: string };
		},
		transaction?: Transaction,
	): Promise<ExtractionItemEntity | null> {
		const updated = await this.extractionItemModel
			.query(transaction)
			.patch(payload)
			.where({ documentId, id, status: ExtractionItemStatus.PENDING })
			.returning("*")
			.first();

		return updated ? toEntity(updated) : null;
	}

	public async updatePendingReviewPlacement(
		{
			documentId,
			extractionSectionId,
			id,
			position,
			text,
			title,
		}: {
			documentId: number;
			extractionSectionId: number;
			id: number;
			position: number;
			text: string;
			title: string;
		},
		transaction: Transaction,
	): Promise<ExtractionItemEntity | null> {
		const updated = await this.extractionItemModel
			.query(transaction)
			.patch({
				extractionSectionId,
				position,
				text,
				title,
			})
			.where({ documentId, id, status: ExtractionItemStatus.PENDING })
			.returning("*")
			.first();

		return updated ? toEntity(updated) : null;
	}
}

export { ExtractionItemRepository };
