import { type Entity } from "~/shared/types/types.js";

type KnowledgeNodeObject = {
	content: string;
	createdAt: string;
	id: number;
	projectId: number;
	title: string;
	updatedAt: string;
};

class KnowledgeNodeEntity implements Entity {
	private content: string;
	private createdAt: string;
	private id: null | number;
	private projectId: number;
	private title: string;
	private updatedAt: string;

	private constructor({
		content,
		createdAt,
		id,
		projectId,
		title,
		updatedAt,
	}: {
		content: string;
		createdAt?: string;
		id: null | number;
		projectId: number;
		title: string;
		updatedAt?: string;
	}) {
		this.id = id;
		this.projectId = projectId;
		this.title = title;
		this.content = content;
		this.createdAt = createdAt ?? new Date().toISOString();
		this.updatedAt = updatedAt ?? new Date().toISOString();
	}

	public static initialize(data: {
		content: string;
		createdAt: string;
		id: number;
		projectId: number;
		title: string;
		updatedAt: string;
	}): KnowledgeNodeEntity {
		return new KnowledgeNodeEntity(data);
	}

	public toNewObject(): {
		content: string;
		projectId: number;
		title: string;
	} {
		return {
			content: this.content,
			projectId: this.projectId,
			title: this.title,
		};
	}

	public toObject(): KnowledgeNodeObject {
		return {
			content: this.content,
			createdAt: this.createdAt,
			id: this.id as number,
			projectId: this.projectId,
			title: this.title,
			updatedAt: this.updatedAt,
		};
	}
}

export { KnowledgeNodeEntity };
