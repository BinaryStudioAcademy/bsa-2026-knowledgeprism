import {
	KnowledgeNodeType,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import {
	type KnowledgeNodeContentDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { KnowledgeNodeEntity } from "../models/knowledge-node.entity.js";
import { type KnowledgeNodeModel } from "../models/knowledge-node.model.js";

type RecentKnowledgeDatabaseRow = {
	id: number;
	projectId: number;
	title: string;
	updatedAt: Date;
};

type TreeKnowledgeDatabaseRow = {
	id: number;
	parentId: null | number;
	position: number;
	title: string;
	type: KnowledgeTreeItemResponseDto["type"];
	updatedAt: Date;
};

const EMPTY_LENGTH = 0;
const FIRST_POSITION = 0;
const POSITION_STEP = 1;

class KnowledgeNodeRepository {
	private knowledgeNodeModel: typeof KnowledgeNodeModel;

	public constructor(knowledgeNodeModel: typeof KnowledgeNodeModel) {
		this.knowledgeNodeModel = knowledgeNodeModel;
	}

	public async create(
		{ entity, userId }: { entity: KnowledgeNodeEntity; userId: number },
		transaction: Transaction,
	): Promise<KnowledgeNodeEntity> {
		const node = await this.knowledgeNodeModel
			.query(transaction)
			.insert({
				...entity.toNewObject(),
				createdBy: userId,
				updatedBy: userId,
			})
			.returning("*")
			.execute();

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

	public async findNextRootPosition(
		projectId: number,
		transaction: Transaction,
	): Promise<number> {
		const lastRootNode = await this.knowledgeNodeModel
			.query(transaction)
			.select("position")
			.where({ projectId })
			.whereNull("parentId")
			.orderBy("position", "desc")
			.first()
			.execute();

		return lastRootNode
			? lastRootNode.position + POSITION_STEP
			: FIRST_POSITION;
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
			.whereNot("type", KnowledgeNodeType.SECTION)
			.whereNull("parentId")
			.orderBy("updatedAt", "desc")
			.castTo<RecentKnowledgeDatabaseRow[]>()
			.execute();
	}

	public async findTreeItemsByProjectId(
		projectId: number,
	): Promise<TreeKnowledgeDatabaseRow[]> {
		return await this.knowledgeNodeModel
			.query()
			.select(["id", "parentId", "position", "title", "type", "updatedAt"])
			.where({ projectId })
			.orderBy("position", "asc")
			.orderBy("id", "asc")
			.castTo<TreeKnowledgeDatabaseRow[]>()
			.execute();
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
			.where({ projectId, type: KnowledgeNodeType.ENTRY })
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
				parentId: node.parentId,
				position: node.position,
				projectId: node.projectId,
				title: node.title,
				type: node.type,
				updatedAt: node.updatedAt,
			}),
		);
	}

	public async update(
		{
			contentJson,
			id,
			title,
			updatedBy,
		}: {
			contentJson: KnowledgeNodeContentDto;
			id: number;
			title: string;
			updatedBy: number;
		},
		transaction?: Transaction,
	): Promise<KnowledgeNodeEntity> {
		const updatedNode = await this.knowledgeNodeModel
			.query(transaction)
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
