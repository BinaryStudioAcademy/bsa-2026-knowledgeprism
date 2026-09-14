import { KnowledgeNodeEntity } from "../models/knowledge-node.entity.js";
import { type KnowledgeNodeModel } from "../models/knowledge-node.model.js";

class KnowledgeNodeRepository {
	private knowledgeNodeModel: typeof KnowledgeNodeModel;

	public constructor(knowledgeNodeModel: typeof KnowledgeNodeModel) {
		this.knowledgeNodeModel = knowledgeNodeModel;
	}

	public async findById(id: number): Promise<KnowledgeNodeEntity | null> {
		const node = await this.knowledgeNodeModel.query().findById(id).execute();

		if (!node) {
			return null;
		}

		return KnowledgeNodeEntity.initialize({
			content: node.content,
			createdAt: node.createdAt,
			id: node.id,
			projectId: node.projectId,
			title: node.title,
			updatedAt: node.updatedAt,
		});
	}

	public async update({
		content,
		id,
		title,
		updatedBy,
	}: {
		content: string;
		id: number;
		title: string;
		updatedBy: number;
	}): Promise<KnowledgeNodeEntity> {
		const updatedNode = await this.knowledgeNodeModel
			.query()
			.patchAndFetchById(id, {
				content,
				title,
				updatedAt: new Date().toISOString(),
				updatedBy,
			})
			.execute();

		return KnowledgeNodeEntity.initialize({
			content: updatedNode.content,
			createdAt: updatedNode.createdAt,
			id: updatedNode.id,
			projectId: updatedNode.projectId,
			title: updatedNode.title,
			updatedAt: updatedNode.updatedAt,
		});
	}
}

export { KnowledgeNodeRepository };
