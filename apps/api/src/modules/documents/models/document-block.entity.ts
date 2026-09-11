import { type Entity } from "~/shared/types/types.js";

type DocumentBlockObject = {
	content: string;
	documentId: number;
	id: number;
	pageNumber: number;
};

class DocumentBlockEntity implements Entity {
	private content: string;

	private documentId: number;

	private id: null | number;

	private pageNumber: number;

	private constructor({
		content,
		documentId,
		id,
		pageNumber,
	}: {
		content: string;
		documentId: number;
		id: null | number;
		pageNumber: number;
	}) {
		this.content = content;
		this.documentId = documentId;
		this.id = id;
		this.pageNumber = pageNumber;
	}

	public static initialize({
		content,
		documentId,
		id,
		pageNumber,
	}: {
		content: string;
		documentId: number;
		id: number;
		pageNumber: number;
	}): DocumentBlockEntity {
		return new DocumentBlockEntity({ content, documentId, id, pageNumber });
	}

	public static initializeNew({
		content,
		documentId,
		pageNumber,
	}: {
		content: string;
		documentId: number;
		pageNumber: number;
	}): DocumentBlockEntity {
		return new DocumentBlockEntity({
			content,
			documentId,
			id: null,
			pageNumber,
		});
	}

	public toNewObject(): {
		content: string;
		documentId: number;
		pageNumber: number;
	} {
		return {
			content: this.content,
			documentId: this.documentId,
			pageNumber: this.pageNumber,
		};
	}

	public toObject(): DocumentBlockObject {
		return {
			content: this.content,
			documentId: this.documentId,
			id: this.id as number,
			pageNumber: this.pageNumber,
		};
	}
}

export { DocumentBlockEntity };
