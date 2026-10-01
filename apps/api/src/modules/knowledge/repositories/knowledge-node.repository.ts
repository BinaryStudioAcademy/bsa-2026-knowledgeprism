import {
	KnowledgeNodeType,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import {
	type KnowledgeNodeContentDto,
	type KnowledgeTreeItemResponseDto,
} from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { isMatchingSearchQuery } from "../libs/helpers/helpers.js";
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
const SLICE_START_INDEX = 0;

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

	public async deleteByIdAndProjectId(
		{ id, projectId }: { id: number; projectId: number },
		transaction: Transaction,
	): Promise<boolean> {
		const deletedCount = await this.knowledgeNodeModel
			.query(transaction)
			.delete()
			.where({ id, projectId })
			.execute();

		return deletedCount > EMPTY_LENGTH;
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

	public async lockByIdAndProjectId(
		{ id, projectId }: { id: number; projectId: number },
		transaction: Transaction,
	): Promise<KnowledgeNodeEntity | null> {
		const node = await this.knowledgeNodeModel
			.query(transaction)
			.findOne({ id, projectId })
			.forUpdate()
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

	public async lockByProjectId(
		projectId: number,
		transaction: Transaction,
	): Promise<KnowledgeNodeEntity[]> {
		const nodes = await this.knowledgeNodeModel
			.query(transaction)
			.where({ projectId })
			.forUpdate()
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

	public async searchByTitleOrKeyword({
		projectId,
		query,
	}: {
		projectId: number;
		query: string;
	}): Promise<KnowledgeNodeEntity[]> {
		const lowerCaseQuery = query.trim().toLowerCase();

		const allNodes = await this.knowledgeNodeModel
			.query()
			.where({ projectId, type: KnowledgeNodeType.ENTRY })
			.orderBy("title", "asc")
			.execute();

		// Matching happens in JS, not SQL (e.g. `content_json::text ILIKE`), because the
		// content is BlockNote's block tree: a raw JSON-text match would also match the
		// block structure's own keys ("text", "type", ...), returning nearly every entry.
		const matchingNodes = lowerCaseQuery
			? allNodes.filter((node) => isMatchingSearchQuery(node, lowerCaseQuery))
			: allNodes;

		const nodes = matchingNodes.slice(
			SLICE_START_INDEX,
			KnowledgeValidationRule.SEARCH_RESULTS_MAXIMUM_COUNT,
		);

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

	public async updatePlacement(
		{
			id,
			parentId,
			position,
			updatedBy,
		}: {
			id: number;
			parentId: null | number;
			position: number;
			updatedBy: number;
		},
		transaction: Transaction,
	): Promise<KnowledgeNodeEntity> {
		const updatedNode = await this.knowledgeNodeModel
			.query(transaction)
			.patchAndFetchById(id, {
				parentId,
				position,
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
