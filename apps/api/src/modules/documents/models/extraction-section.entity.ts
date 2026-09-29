import { type KnowledgeNodeType } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

type ExtractionSectionObject = {
	documentId: number;
	id: number;
	position: number;
	title: string;
	type: ValueOf<typeof KnowledgeNodeType>;
};

class ExtractionSectionEntity implements Entity {
	private documentId: number;

	private id: number;

	private position: number;

	private title: string;

	private type: ValueOf<typeof KnowledgeNodeType>;

	private constructor({
		documentId,
		id,
		position,
		title,
		type,
	}: ExtractionSectionObject) {
		this.documentId = documentId;
		this.id = id;
		this.position = position;
		this.title = title;
		this.type = type;
	}

	public static initialize(
		data: ExtractionSectionObject,
	): ExtractionSectionEntity {
		return new ExtractionSectionEntity(data);
	}

	public toNewObject(): Omit<ExtractionSectionObject, "id"> {
		return {
			documentId: this.documentId,
			position: this.position,
			title: this.title,
			type: this.type,
		};
	}

	public toObject(): ExtractionSectionObject {
		return {
			...this.toNewObject(),
			id: this.id,
		};
	}
}

export { ExtractionSectionEntity };
