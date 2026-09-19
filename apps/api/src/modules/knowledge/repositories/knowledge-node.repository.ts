import { KnowledgeNodeEntity } from "../models/knowledge-node.entity.js";
import { type KnowledgeNodeModel } from "../models/knowledge-node.model.js";

type RecentKnowledgeDatabaseRow = {
	id: number;
	projectId: number;
	title: string;
	updatedAt: Date;
};

const EMPTY_LENGTH = 0;

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
			.where("projectId", projectId)
			.execute();

		return nodes.map((node) =>
			KnowledgeNodeEntity.initialize({
				contentJson: node.contentJson,
				createdAt: node.createdAt.toISOString(),
				id: node.id,
				projectId: node.projectId,
				title: node.title,
				updatedAt: node.updatedAt.toISOString(),
			}),
		);
	}

	public async findById(id: number): Promise<KnowledgeNodeEntity | null> {
		const node = await this.knowledgeNodeModel.query().findById(id).execute();

		if (!node) {
			return null;
		}

		return KnowledgeNodeEntity.initialize({
			contentJson: node.contentJson,
			createdAt: node.createdAt.toISOString(),
			id: node.id,
			projectId: node.projectId,
			title: node.title,
			updatedAt: node.updatedAt.toISOString(),
		});
	}

	public async findRecentByProjectIds(
		projectIds: number[],
	): Promise<RecentKnowledgeDatabaseRow[]> {
		if (projectIds.length === EMPTY_LENGTH) {
			return [];
		}

		return await this.knowledgeNodeModel
			.query()
			.select(["id", "projectId", "title", "updatedAt"])
			.whereIn("projectId", projectIds)
			.orderBy("updatedAt", "desc")
			.castTo<RecentKnowledgeDatabaseRow[]>()
			.execute();
	}

	public async update({
		contentJson,
		id,
		title,
		updatedBy,
	}: {
		contentJson: Record<string, unknown>[];
		id: number;
		title: string;
		updatedBy: number;
	}): Promise<KnowledgeNodeEntity> {
		const updatedNode = await this.knowledgeNodeModel
			.query()
			.patchAndFetchById(id, {
				contentJson,
				title,
				updatedAt: new Date(),
				updatedBy,
			})
			.execute();

		return KnowledgeNodeEntity.initialize({
			contentJson: updatedNode.contentJson,
			createdAt: updatedNode.createdAt.toISOString(),
			id: updatedNode.id,
			projectId: updatedNode.projectId,
			title: updatedNode.title,
			updatedAt: updatedNode.updatedAt.toISOString(),
		});
	}
}

export { KnowledgeNodeRepository };
