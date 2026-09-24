import { type KnowledgeNodeType } from "@knowledgeprism/constants";
import {
	type KnowledgeNodeContentDto,
	type ValueOf,
} from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

type KnowledgeNodeDetails = {
	contentJson: KnowledgeNodeContentDto;
	createdAt: string;
	id: number;
	parentId: null | number;
	position: number;
	projectId: number;
	title: string;
	type: ValueOf<typeof KnowledgeNodeType>;
	updatedAt: string;
};

class KnowledgeNodeEntity implements Entity {
	private contentJson: KnowledgeNodeContentDto;
	private createdAt: Date;
	private id: null | number;
	private parentId: null | number;
	private position: number;
	private projectId: number;
	private title: string;
	private type: ValueOf<typeof KnowledgeNodeType>;
	private updatedAt: Date;

	private constructor({
		contentJson,
		createdAt,
		id,
		parentId,
		position,
		projectId,
		title,
		type,
		updatedAt,
	}: {
		contentJson: KnowledgeNodeContentDto;
		createdAt?: Date;
		id: null | number;
		parentId: null | number;
		position: number;
		projectId: number;
		title: string;
		type: ValueOf<typeof KnowledgeNodeType>;
		updatedAt?: Date;
	}) {
		this.id = id;
		this.projectId = projectId;
		this.title = title;
		this.contentJson = contentJson;
		this.parentId = parentId;
		this.position = position;
		this.type = type;
		this.createdAt = createdAt ?? new Date();
		this.updatedAt = updatedAt ?? new Date();
	}

	public static initialize(data: {
		contentJson: KnowledgeNodeContentDto;
		createdAt: Date;
		id: number;
		parentId: null | number;
		position: number;
		projectId: number;
		title: string;
		type: ValueOf<typeof KnowledgeNodeType>;
		updatedAt: Date;
	}): KnowledgeNodeEntity {
		return new KnowledgeNodeEntity(data);
	}

	public toNewObject(): {
		contentJson: KnowledgeNodeContentDto;
		parentId: null | number;
		position: number;
		projectId: number;
		title: string;
		type: ValueOf<typeof KnowledgeNodeType>;
	} {
		return {
			contentJson: this.contentJson,
			parentId: this.parentId,
			position: this.position,
			projectId: this.projectId,
			title: this.title,
			type: this.type,
		};
	}

	public toObject(): KnowledgeNodeDetails {
		return {
			contentJson: this.contentJson,
			createdAt: this.createdAt.toISOString(),
			id: this.id as number,
			parentId: this.parentId,
			position: this.position,
			projectId: this.projectId,
			title: this.title,
			type: this.type,
			updatedAt: this.updatedAt.toISOString(),
		};
	}
}

export { KnowledgeNodeEntity };
