import {
	IntegrationChangeType,
	IntegrationResolution,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type IntegrationConflictResolutionDto,
	type KnowledgeNodeContentDto,
} from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";

type ApplyParameters = {
	changes: IntegrationChangeEntity[];
	document: DocumentEntity;
	resolutions: IntegrationConflictResolutionDto[];
	userId: number;
};

type Constructor = {
	extractionItemRepository: ExtractionItemRepository;
	knowledgeNodeRepository: KnowledgeNodeRepository;
};

const EMPTY_LENGTH = 0;
const PARAGRAPH_BLOCK_TYPE = "paragraph";

const toContentJson = (text: string): KnowledgeNodeContentDto => [
	{ content: text, type: PARAGRAPH_BLOCK_TYPE },
];

class IntegrationApplier {
	private extractionItemRepository: ExtractionItemRepository;

	private knowledgeNodeRepository: KnowledgeNodeRepository;

	public constructor({
		extractionItemRepository,
		knowledgeNodeRepository,
	}: Constructor) {
		this.extractionItemRepository = extractionItemRepository;
		this.knowledgeNodeRepository = knowledgeNodeRepository;
	}

	private async applyToMatchedNode(
		{
			change,
			node,
			resolution,
			userId,
		}: {
			change: IntegrationChangeEntity;
			node: KnowledgeNodeEntity;
			resolution: IntegrationConflictResolutionDto | undefined;
			userId: number;
		},
		transaction: Transaction,
	): Promise<void> {
		const { extractionItemId, incomingContent, incomingTitle, type } =
			change.toObject();
		const { contentJson, id, title } = node.toObject();
		const isUseIncomingTitle =
			resolution?.title === IntegrationResolution.USE_NEW;
		const isUseIncomingContent =
			type === IntegrationChangeType.UPDATE ||
			resolution?.content === IntegrationResolution.USE_NEW;

		if (isUseIncomingTitle || isUseIncomingContent) {
			await this.knowledgeNodeRepository.update(
				{
					contentJson: isUseIncomingContent
						? toContentJson(incomingContent)
						: contentJson,
					id,
					title: isUseIncomingTitle ? incomingTitle : title,
					updatedBy: userId,
				},
				transaction,
			);
		}

		await this.extractionItemRepository.linkKnowledgeNode(
			{ id: extractionItemId, knowledgeNodeId: id },
			transaction,
		);
	}

	private async createEntries(
		{
			changes,
			document,
			userId,
		}: Pick<ApplyParameters, "changes" | "document" | "userId">,
		transaction: Transaction,
	): Promise<void> {
		if (changes.length === EMPTY_LENGTH) {
			return;
		}

		const { name, projectId } = document.toObject();
		const pagePosition =
			await this.knowledgeNodeRepository.findNextRootPosition(
				projectId,
				transaction,
			);
		const pageNode = await this.knowledgeNodeRepository.create(
			{
				entity: KnowledgeNodeEntity.initializeNew({
					contentJson: [],
					parentId: null,
					position: pagePosition,
					projectId,
					title: name,
					type: KnowledgeNodeType.PAGE,
				}),
				userId,
			},
			transaction,
		);

		for (const [position, change] of changes.entries()) {
			const { extractionItemId, incomingContent, incomingTitle } =
				change.toObject();
			const entryNode = await this.knowledgeNodeRepository.create(
				{
					entity: KnowledgeNodeEntity.initializeNew({
						contentJson: toContentJson(incomingContent),
						parentId: pageNode.toObject().id,
						position,
						projectId,
						title: incomingTitle,
						type: KnowledgeNodeType.ENTRY,
					}),
					userId,
				},
				transaction,
			);

			await this.extractionItemRepository.linkKnowledgeNode(
				{ id: extractionItemId, knowledgeNodeId: entryNode.toObject().id },
				transaction,
			);
		}
	}

	public async apply(
		{ changes, document, resolutions, userId }: ApplyParameters,
		transaction: Transaction,
	): Promise<void> {
		const { projectId } = document.toObject();
		const resolutionByChangeId = new Map(
			resolutions.map((resolution) => [resolution.changeId, resolution]),
		);
		const newChanges: IntegrationChangeEntity[] = [];

		for (const change of changes) {
			const { id, matchedNodeId, type } = change.toObject();
			const matchedNode =
				matchedNodeId === null || type === IntegrationChangeType.NEW
					? null
					: await this.knowledgeNodeRepository.findByIdAndProjectId(
							matchedNodeId,
							projectId,
						);

			if (matchedNode) {
				await this.applyToMatchedNode(
					{
						change,
						node: matchedNode,
						resolution: resolutionByChangeId.get(id),
						userId,
					},
					transaction,
				);
			} else {
				newChanges.push(change);
			}
		}

		await this.createEntries(
			{ changes: newChanges, document, userId },
			transaction,
		);
	}
}

export { IntegrationApplier };
