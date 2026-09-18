import { KnowledgeValidationRule } from "@knowledgeprism/constants";

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
			contentJson: node.contentJson,
			createdAt: node.createdAt,
			id: node.id,
			projectId: node.projectId,
			title: node.title,
			updatedAt: node.updatedAt,
		});
	}

	public async searchByTitleOrKeyword({
		projectId,
		query,
	}: {
		projectId: number;
		query: string;
	}): Promise<KnowledgeNodeEntity[]> {
		const escapedQuery = query
			.replaceAll("%", String.raw`\%`)
			.replaceAll("_", String.raw`\_`);
		const pattern = `%${escapedQuery}%`;

		const nodes = await this.knowledgeNodeModel
			.query()
			.where({ projectId })
			.andWhere((builder) => {
				void builder
					.where("title", "ilike", pattern)
					.orWhereRaw("content_json::text ILIKE ?", [pattern]);
			})
			.orderBy("title", "asc")
			.limit(KnowledgeValidationRule.SEARCH_RESULTS_MAXIMUM_COUNT)
			.execute();

		return nodes.map((node) =>
			KnowledgeNodeEntity.initialize({
				contentJson: node.contentJson,
				createdAt: node.createdAt,
				id: node.id,
				projectId: node.projectId,
				title: node.title,
				updatedAt: node.updatedAt,
			}),
		);
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
				updatedAt: new Date().toISOString(),
				updatedBy,
			})
			.execute();

		return KnowledgeNodeEntity.initialize({
			contentJson: updatedNode.contentJson,
			createdAt: updatedNode.createdAt,
			id: updatedNode.id,
			projectId: updatedNode.projectId,
			title: updatedNode.title,
			updatedAt: updatedNode.updatedAt,
		});
	}
}

export { KnowledgeNodeRepository };
