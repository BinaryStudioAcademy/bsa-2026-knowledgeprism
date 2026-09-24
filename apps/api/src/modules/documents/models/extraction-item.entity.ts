import { type ExtractionItemStatus } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

type ExtractionItemObject = {
	confidence: number;
	documentId: number;
	id: number;
	knowledgeNodeId: null | number;
	rationale: string;
	sourceExcerpt: string;
	sourcePageNumber: number;
	status: ValueOf<typeof ExtractionItemStatus>;
	text: string;
	title: string;
};

class ExtractionItemEntity implements Entity {
	private confidence: number;

	private documentId: number;

	private id: number;

	private knowledgeNodeId: null | number;

	private rationale: string;

	private sourceExcerpt: string;

	private sourcePageNumber: number;

	private status: ValueOf<typeof ExtractionItemStatus>;

	private text: string;

	private title: string;

	private constructor({
		confidence,
		documentId,
		id,
		knowledgeNodeId,
		rationale,
		sourceExcerpt,
		sourcePageNumber,
		status,
		text,
		title,
	}: ExtractionItemObject) {
		this.confidence = confidence;
		this.documentId = documentId;
		this.id = id;
		this.knowledgeNodeId = knowledgeNodeId;
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
			confidence: this.confidence,
			documentId: this.documentId,
			knowledgeNodeId: this.knowledgeNodeId,
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
