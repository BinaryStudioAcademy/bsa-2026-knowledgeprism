import { type Entity } from "~/shared/types/types.js";

type KnowledgeNodeObject = {
	contentJson: Record<string, unknown>[];
	createdAt: string;
	id: number;
	projectId: number;
	title: string;
	updatedAt: string;
};

class KnowledgeNodeEntity implements Entity {
	private contentJson: Record<string, unknown>[];
	private createdAt: string;
	private id: null | number;
	private projectId: number;
	private title: string;
	private updatedAt: string;

	private constructor({
		contentJson,
		createdAt,
		id,
		projectId,
		title,
		updatedAt,
	}: {
		contentJson: Record<string, unknown>[];
		createdAt?: string;
		id: null | number;
		projectId: number;
		title: string;
		updatedAt?: string;
	}) {
		this.id = id;
		this.projectId = projectId;
		this.title = title;
		this.contentJson = contentJson;
		this.createdAt = createdAt ?? new Date().toISOString();
		this.updatedAt = updatedAt ?? new Date().toISOString();
	}

	public static initialize(data: {
		contentJson: Record<string, unknown>[];
		createdAt: string;
		id: number;
		projectId: number;
		title: string;
		updatedAt: string;
	}): KnowledgeNodeEntity {
		return new KnowledgeNodeEntity(data);
	}

	public toNewObject(): {
		contentJson: Record<string, unknown>[];
		projectId: number;
		title: string;
	} {
		return {
			contentJson: this.contentJson,
			projectId: this.projectId,
			title: this.title,
		};
	}

	public toObject(): KnowledgeNodeObject {
		return {
			contentJson: this.contentJson,
			createdAt: this.createdAt,
			id: this.id as number,
			projectId: this.projectId,
			title: this.title,
			updatedAt: this.updatedAt,
		};
	}
}

export { KnowledgeNodeEntity };
