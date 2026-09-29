import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type Transaction } from "objection";

import { ExtractionSectionEntity } from "~/modules/documents/models/extraction-section.entity.js";
import { type ExtractionSectionModel } from "~/modules/documents/models/extraction-section.model.js";

type NewExtractionSection = {
	position: number;
	title: string;
};

type ReplacedSections = {
	positionOffset: number;
	sections: ExtractionSectionEntity[];
};

const EMPTY_LENGTH = 0;
const NO_PRESERVED_POSITION = -1;
const POSITION_STEP = 1;

const toEntity = (section: ExtractionSectionModel): ExtractionSectionEntity =>
	ExtractionSectionEntity.initialize({
		documentId: section.documentId,
		id: section.id,
		position: section.position,
		title: section.title,
		type: section.type,
	});

class ExtractionSectionRepository {
	private extractionSectionModel: typeof ExtractionSectionModel;

	public constructor(extractionSectionModel: typeof ExtractionSectionModel) {
		this.extractionSectionModel = extractionSectionModel;
	}

	public async findByDocumentId(
		documentId: number,
		transaction?: Transaction,
	): Promise<ExtractionSectionEntity[]> {
		const sections = await this.extractionSectionModel
			.query(transaction)
			.where({ documentId })
			.orderBy("position", "asc")
			.orderBy("id", "asc")
			.execute();

		return sections.map((section) => toEntity(section));
	}

	public async replaceByDocumentId(
		{
			documentId,
			preserveSectionIds,
			sections,
		}: {
			documentId: number;
			preserveSectionIds: number[];
			sections: NewExtractionSection[];
		},
		transaction: Transaction,
	): Promise<ReplacedSections> {
		const existingSections = await this.findByDocumentId(
			documentId,
			transaction,
		);
		const preserveIdSet = new Set(preserveSectionIds);
		const deletionQuery = this.extractionSectionModel
			.query(transaction)
			.delete()
			.where({ documentId });

		if (preserveSectionIds.length > EMPTY_LENGTH) {
			void deletionQuery.whereNotIn("id", preserveSectionIds);
		}

		await deletionQuery.execute();

		const preservedPositions = existingSections
			.filter((section) => preserveIdSet.has(section.toObject().id))
			.map((section) => section.toObject().position);
		const positionOffset =
			Math.max(NO_PRESERVED_POSITION, ...preservedPositions) + POSITION_STEP;

		if (sections.length === EMPTY_LENGTH) {
			return { positionOffset, sections: [] };
		}

		const insertedSections = await this.extractionSectionModel
			.query(transaction)
			.insert(
				sections.map((section) => ({
					...section,
					documentId,
					position: section.position + positionOffset,
					type: KnowledgeNodeType.SECTION,
				})),
			)
			.returning("*")
			.execute();

		return {
			positionOffset,
			sections: insertedSections.map((section) => toEntity(section)),
		};
	}
}

export { ExtractionSectionRepository };
