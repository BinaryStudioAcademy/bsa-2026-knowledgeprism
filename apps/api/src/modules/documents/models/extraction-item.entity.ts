import { type ExtractionItemStatus } from "@knowledgeprism/constants";
import {
	type ExtractionContentBlock,
	type ValueOf,
} from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

type ExtractionItemObject = {
	blocks?: ExtractionContentBlock[];
	confidence: number;
	documentId: number;
	extractionSectionId: null | number;
	heading: null | string;
	id: number;
	knowledgeNodeId: null | number;
	position: number;
	rationale: string;
	sourceExcerpt: string;
	sourcePageNumber: number;
	status: ValueOf<typeof ExtractionItemStatus>;
	text: string;
	title: string;
};

class ExtractionItemEntity implements Entity {
	private blocks: ExtractionContentBlock[];

	private confidence: number;

	private documentId: number;

	private extractionSectionId: null | number;

	private heading: null | string;

	private id: number;

	private knowledgeNodeId: null | number;

	private position: number;

	private rationale: string;

	private sourceExcerpt: string;

	private sourcePageNumber: number;

	private status: ValueOf<typeof ExtractionItemStatus>;

	private text: string;

	private title: string;

	private constructor({
		blocks = [],
		confidence,
		documentId,
		extractionSectionId,
		heading,
		id,
		knowledgeNodeId,
		position,
		rationale,
		sourceExcerpt,
		sourcePageNumber,
		status,
		text,
		title,
	}: ExtractionItemObject) {
		this.blocks = blocks;
		this.confidence = confidence;
		this.documentId = documentId;
		this.extractionSectionId = extractionSectionId;
		this.heading = heading;
		this.id = id;
		this.knowledgeNodeId = knowledgeNodeId;
		this.position = position;
		this.rationale = rationale;
		this.sourceExcerpt = sourceExcerpt;
		this.sourcePageNumber = sourcePageNumber;
		this.status = status;
		this.text = text;
		this.title = title;
	}

	public static initialize(data: ExtractionItemObject): ExtractionItemEntity {
		return new ExtractionItemEntity(data);
	}

	public toNewObject(): Omit<ExtractionItemObject, "id"> {
		return {
			blocks: this.blocks,
			confidence: this.confidence,
			documentId: this.documentId,
			extractionSectionId: this.extractionSectionId,
			heading: this.heading,
			knowledgeNodeId: this.knowledgeNodeId,
			position: this.position,
			rationale: this.rationale,
			sourceExcerpt: this.sourceExcerpt,
			sourcePageNumber: this.sourcePageNumber,
			status: this.status,
			text: this.text,
			title: this.title,
		};
	}

	public toObject(): ExtractionItemObject {
		return {
			...this.toNewObject(),
			id: this.id,
		};
	}
}

export { ExtractionItemEntity };
