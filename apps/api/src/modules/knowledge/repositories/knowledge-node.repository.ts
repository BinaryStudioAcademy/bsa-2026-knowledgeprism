import { type KnowledgeNodeContentDto } from "@knowledgeprism/types";

import { KnowledgeNodeEntity } from "../models/knowledge-node.entity.js";
import { type KnowledgeNodeModel } from "../models/knowledge-node.model.js";

class KnowledgeNodeRepository {
	private knowledgeNodeModel: typeof KnowledgeNodeModel;

	public constructor(knowledgeNodeModel: typeof KnowledgeNodeModel) {
		this.knowledgeNodeModel = knowledgeNodeModel;
	}

	public async findAllByProjectId(
		projectId: number,
	): Promise<KnowledgeNodeEntity[]> {
		const nodes = await this.knowledgeNodeModel
			.query()
			.where({ projectId })
			.orderBy("position", "asc")
			.orderBy("id", "asc")
			.execute();

		return nodes.map((node) =>
			KnowledgeNodeEntity.initialize({
				contentJson: node.contentJson,
				createdAt: node.createdAt,
				id: node.id,
				parentId: node.parentId,
				position: node.position,
				projectId: node.projectId,
				title: node.title,
				type: node.type,
				updatedAt: node.updatedAt,
			}),
		);
	}

	public async findByIdAndProjectId(
		id: number,
		projectId: number,
	): Promise<KnowledgeNodeEntity | null> {
		const node = await this.knowledgeNodeModel
			.query()
			.findOne({ id, projectId })
			.execute();

		if (!node) {
			return null;
		}

		return KnowledgeNodeEntity.initialize({
			contentJson: node.contentJson,
			createdAt: node.createdAt,
			id: node.id,
			parentId: node.parentId,
			position: node.position,
			projectId: node.projectId,
			title: node.title,
			type: node.type,
			updatedAt: node.updatedAt,
		});
	}

	public async update({
		contentJson,
		id,
		title,
		updatedBy,
	}: {
		contentJson: KnowledgeNodeContentDto;
		id: number;
		title: string;
		updatedBy: number;
	}): Promise<KnowledgeNodeEntity> {
		const updatedNode = await this.knowledgeNodeModel
			.query()
			.patchAndFetchById(id, {
				contentJson,
				title,
				updatedBy,
			})
			.execute();

		return KnowledgeNodeEntity.initialize({
			contentJson: updatedNode.contentJson,
			createdAt: updatedNode.createdAt,
			id: updatedNode.id,
			parentId: updatedNode.parentId,
			position: updatedNode.position,
			projectId: updatedNode.projectId,
			title: updatedNode.title,
			type: updatedNode.type,
			updatedAt: updatedNode.updatedAt,
		});
	}
}

export { KnowledgeNodeRepository };
