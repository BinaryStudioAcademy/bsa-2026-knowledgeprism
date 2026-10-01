import { flattenContentToText } from "@knowledgeprism/config";
import {
	IntegrationChangeType,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type IntegrationChangeContentOverrideDto,
	type IntegrationConflictResolutionDto,
	type KnowledgeNodeContentDto,
} from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { getIncomingFields } from "~/modules/documents/libs/helpers/get-incoming-fields.helper.js";
import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";

type ApplyParameters = {
	changes: IntegrationChangeEntity[];
	contentOverrides: IntegrationChangeContentOverrideDto[];
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

const resolveIncoming = (
	change: IntegrationChangeEntity,
	override: IntegrationChangeContentOverrideDto | undefined,
): { incomingContent: string; incomingTitle: string } => {
	const { incomingContent, incomingTitle } = change.toObject();

	return {
		incomingContent: override?.content ?? incomingContent,
		incomingTitle: override?.title ?? incomingTitle,
	};
};

const isNodeChangedSinceAnalysis = (
	node: KnowledgeNodeEntity,
	change: IntegrationChangeEntity,
): boolean => {
	const { contentJson, title } = node.toObject();
	const { liveContent, liveTitle } = change.toObject();

	return (
		title !== liveTitle || flattenContentToText(contentJson) !== liveContent
	);
};

class IntegrationAnalysisOutdatedError extends Error {}

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
			override,
			resolution,
			userId,
		}: {
			change: IntegrationChangeEntity;
			node: KnowledgeNodeEntity;
			override: IntegrationChangeContentOverrideDto | undefined;
			resolution: IntegrationConflictResolutionDto | undefined;
			userId: number;
		},
		transaction: Transaction,
	): Promise<KnowledgeNodeEntity> {
		const { extractionItemId, type } = change.toObject();
		const { incomingContent, incomingTitle } = resolveIncoming(
			change,
			override,
		);
		const { contentJson, id, title } = node.toObject();
		const { content: isUseIncomingContent, title: isUseIncomingTitle } =
			getIncomingFields(type, resolution);
		const appliedNode =
			isUseIncomingTitle || isUseIncomingContent
				? await this.knowledgeNodeRepository.update(
						{
							contentJson: isUseIncomingContent
								? toContentJson(incomingContent)
								: contentJson,
							id,
							title: isUseIncomingTitle ? incomingTitle : title,
							updatedBy: userId,
						},
						transaction,
					)
				: node;

		await this.extractionItemRepository.linkKnowledgeNode(
			{ id: extractionItemId, knowledgeNodeId: id },
			transaction,
		);

		return appliedNode;
	}

	private async createEntries(
		{
			changes,
			document,
			overrideByChangeId,
			userId,
		}: Pick<ApplyParameters, "changes" | "document" | "userId"> & {
			overrideByChangeId: Map<number, IntegrationChangeContentOverrideDto>;
		},
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
			const { extractionItemId, id } = change.toObject();
			const { incomingContent, incomingTitle } = resolveIncoming(
				change,
				overrideByChangeId.get(id),
			);
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

	private async lockUnchangedMatchedNodes(
		{
			changes,
			projectId,
		}: { changes: IntegrationChangeEntity[]; projectId: number },
		transaction: Transaction,
	): Promise<Map<number, KnowledgeNodeEntity>> {
		const nodes = new Map<number, KnowledgeNodeEntity>();

		for (const change of changes) {
			const { matchedNodeId, type } = change.toObject();

			if (type === IntegrationChangeType.NEW) {
				continue;
			}

			if (matchedNodeId === null) {
				throw new IntegrationAnalysisOutdatedError();
			}

			const node =
				nodes.get(matchedNodeId) ??
				(await this.knowledgeNodeRepository.lockByIdAndProjectId(
					{ id: matchedNodeId, projectId },
					transaction,
				));

			if (!node || isNodeChangedSinceAnalysis(node, change)) {
				throw new IntegrationAnalysisOutdatedError();
			}

			nodes.set(matchedNodeId, node);
		}

		return nodes;
	}

	public async apply(
		{
			changes,
			contentOverrides,
			document,
			resolutions,
			userId,
		}: ApplyParameters,
		transaction: Transaction,
	): Promise<void> {
		const { projectId } = document.toObject();
		const resolutionByChangeId = new Map(
			resolutions.map((resolution) => [resolution.changeId, resolution]),
		);
		const overrideByChangeId = new Map(
			contentOverrides.map((override) => [override.changeId, override]),
		);
		const nodes = await this.lockUnchangedMatchedNodes(
			{ changes, projectId },
			transaction,
		);
		const newChanges: IntegrationChangeEntity[] = [];

		for (const change of changes) {
			const { id, matchedNodeId } = change.toObject();
			const matchedNode =
				matchedNodeId === null ? undefined : nodes.get(matchedNodeId);

			if (matchedNode && matchedNodeId !== null) {
				const appliedNode = await this.applyToMatchedNode(
					{
						change,
						node: matchedNode,
						override: overrideByChangeId.get(id),
						resolution: resolutionByChangeId.get(id),
						userId,
					},
					transaction,
				);

				nodes.set(matchedNodeId, appliedNode);
			} else {
				newChanges.push(change);
			}
		}

		await this.createEntries(
			{ changes: newChanges, document, overrideByChangeId, userId },
			transaction,
		);
	}
}

export { IntegrationAnalysisOutdatedError, IntegrationApplier };
