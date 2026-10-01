import { flattenContentToText } from "@knowledgeprism/config";
import {
	DocumentErrorMessage,
	IntegrationChangeType,
	IntegrationResolution,
	KnowledgeNodeType,
} from "@knowledgeprism/constants";
import {
	type ExtractionContentBlock,
	type IntegrationChangeContentOverrideDto,
	type IntegrationChangesApplyRequestDto,
	type IntegrationConflictResolutionDto,
	type KnowledgeNodeContentDto,
} from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { HTTPCode, HTTPError } from "~/infrastructure/http/http.js";
import { appendIncomingAtSpan } from "~/modules/documents/libs/helpers/append-incoming-at-span.helper.js";
import { getIncomingFields } from "~/modules/documents/libs/helpers/get-incoming-fields.helper.js";
import { toKnowledgeContentJson } from "~/modules/documents/libs/helpers/to-knowledge-content-json.helper.js";
import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { KnowledgeNodeEntity } from "~/modules/knowledge/models/knowledge-node.entity.js";
import { type KnowledgeNodeRepository } from "~/modules/knowledge/repositories/knowledge-node.repository.js";

type ApplyParameters = {
	changes: IntegrationChangeEntity[];
	contentOverrides: IntegrationChangeContentOverrideDto[];
	document: DocumentEntity;
	placements: Placement[];
	resolutions: IntegrationConflictResolutionDto[];
	userId: number;
};

type Placement = NonNullable<
	IntegrationChangesApplyRequestDto["placements"]
>[number];

const NEXT_POSITION_OFFSET = 1;
const NO_CHILD_POSITION = -1;

const toWrittenFieldKeys = (
	matchedNodeId: number,
	incomingFields: { content: boolean; title: boolean },
	resolution: IntegrationConflictResolutionDto | undefined,
): string[] => {
	const written = {
		content:
			incomingFields.content ||
			resolution?.content === IntegrationResolution.BOTH,
		title: incomingFields.title,
	};

	return Object.entries(written)
		.filter(([, isWritten]) => isWritten)
		.map(([field]) => `${String(matchedNodeId)}:${field}`);
};

const createInvalidPlacementError = (): HTTPError =>
	new HTTPError({
		message: DocumentErrorMessage.INVALID_PLACEMENT,
		status: HTTPCode.BAD_REQUEST,
	});

type Constructor = {
	extractionItemRepository: ExtractionItemRepository;
	knowledgeNodeRepository: KnowledgeNodeRepository;
};

const EMPTY_LENGTH = 0;
const FIRST_MATCH_INDEX = 0;
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
			blocksByItemId,
			change,
			node,
			override,
			resolution,
			userId,
		}: {
			blocksByItemId: Map<number, ExtractionContentBlock[]>;
			change: IntegrationChangeEntity;
			node: KnowledgeNodeEntity;
			override: IntegrationChangeContentOverrideDto | undefined;
			resolution: IntegrationConflictResolutionDto | undefined;
			userId: number;
		},
		transaction: Transaction,
	): Promise<KnowledgeNodeEntity> {
		const { extractionItemId, placement, type } = change.toObject();
		const { incomingContent, incomingTitle } = resolveIncoming(
			change,
			override,
		);
		const { contentJson, id, title } = node.toObject();

		if (resolution?.content === IntegrationResolution.BOTH) {
			const liveText = flattenContentToText(contentJson);
			const span =
				placement.matches[resolution.matchIndex ?? FIRST_MATCH_INDEX]?.span ??
				placement.matches[FIRST_MATCH_INDEX]?.span ??
				"";
			const nextText = appendIncomingAtSpan(liveText, incomingContent, span);
			const appliedNode =
				nextText === liveText
					? node
					: await this.knowledgeNodeRepository.update(
							{
								contentJson: toContentJson(nextText),
								id,
								title,
								updatedBy: userId,
							},
							transaction,
						);

			await this.extractionItemRepository.linkKnowledgeNode(
				{ id: extractionItemId, knowledgeNodeId: id },
				transaction,
			);

			return appliedNode;
		}

		const { content: isUseIncomingContent, title: isUseIncomingTitle } =
			getIncomingFields(type, resolution);
		const incomingBlocks = blocksByItemId.get(extractionItemId) ?? [];
		const incomingContentJson = toKnowledgeContentJson({
			blocks: incomingBlocks,
			fallbackText: incomingContent,
			title: incomingTitle,
		});
		const appliedNode =
			isUseIncomingTitle || isUseIncomingContent
				? await this.knowledgeNodeRepository.update(
						{
							contentJson: isUseIncomingContent
								? incomingContentJson
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

	private async createDocumentPage(
		{ document, userId }: Pick<ApplyParameters, "document" | "userId">,
		transaction: Transaction,
	): Promise<number> {
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

		return pageNode.toObject().id;
	}

	private async createEntries(
		{
			blocksByItemId,
			changes,
			document,
			overrideByChangeId,
			placements,
			userId,
		}: Pick<
			ApplyParameters,
			"changes" | "document" | "placements" | "userId"
		> & {
			blocksByItemId: Map<number, ExtractionContentBlock[]>;
			overrideByChangeId: Map<number, IntegrationChangeContentOverrideDto>;
		},
		transaction: Transaction,
	): Promise<void> {
		if (changes.length === EMPTY_LENGTH) {
			return;
		}

		const { projectId } = document.toObject();
		const placementByChangeId = new Map(
			placements.map((placement) => [placement.changeId, placement]),
		);
		const nextPositionByParentId = await this.findChosenParents(
			placements,
			projectId,
		);
		let documentPageId: null | number = null;
		const orderedChanges = changes.toSorted(
			(left, right) =>
				(placementByChangeId.get(left.toObject().id)?.position ??
					changes.indexOf(left)) -
				(placementByChangeId.get(right.toObject().id)?.position ??
					changes.indexOf(right)),
		);

		for (const [index, change] of orderedChanges.entries()) {
			const { extractionItemId, id } = change.toObject();
			const chosenParentId = placementByChangeId.get(id)?.parentId ?? null;
			let parentId: number;
			let position: number;

			if (chosenParentId === null) {
				documentPageId ??= await this.createDocumentPage(
					{ document, userId },
					transaction,
				);
				parentId = documentPageId;
				position = index;
			} else {
				parentId = chosenParentId;
				position = nextPositionByParentId.get(chosenParentId) ?? index;
				nextPositionByParentId.set(
					chosenParentId,
					position + NEXT_POSITION_OFFSET,
				);
			}

			const { incomingContent, incomingTitle } = resolveIncoming(
				change,
				overrideByChangeId.get(id),
			);
			const blocks = blocksByItemId.get(extractionItemId) ?? [];
			const contentJson = toKnowledgeContentJson({
				blocks,
				fallbackText: incomingContent,
				title: incomingTitle,
			});
			const entryNode = await this.knowledgeNodeRepository.create(
				{
					entity: KnowledgeNodeEntity.initializeNew({
						contentJson,
						parentId,
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

	private async findChosenParents(
		placements: Placement[],
		projectId: number,
	): Promise<Map<number, number>> {
		const parentIds = [
			...new Set(
				placements.flatMap((placement) =>
					placement.parentId === null ? [] : [placement.parentId],
				),
			),
		];
		const nodes =
			parentIds.length === EMPTY_LENGTH
				? []
				: await this.knowledgeNodeRepository.findAllByProjectId(projectId);
		const nextPositionByParentId = new Map<number, number>();

		for (const parentId of parentIds) {
			const parent = nodes.find((node) => node.toObject().id === parentId);

			if (parent?.toObject().type !== KnowledgeNodeType.PAGE) {
				throw createInvalidPlacementError();
			}

			const lastChildPosition = Math.max(
				NO_CHILD_POSITION,
				...nodes
					.map((node) => node.toObject())
					.filter((node) => node.parentId === parentId)
					.map((node) => node.position),
			);

			nextPositionByParentId.set(
				parentId,
				lastChildPosition + NEXT_POSITION_OFFSET,
			);
		}

		return nextPositionByParentId;
	}

	private async loadBlocksByItemId(
		documentId: number,
		transaction: Transaction,
	): Promise<Map<number, ExtractionContentBlock[]>> {
		const items = await this.extractionItemRepository.findByDocumentId(
			documentId,
			transaction,
		);

		return new Map(
			items.map((item) => {
				const { blocks, id } = item.toObject();

				return [id, blocks ?? []] as const;
			}),
		);
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
			placements,
			resolutions,
			userId,
		}: ApplyParameters,
		transaction: Transaction,
	): Promise<void> {
		const { id: documentId, projectId } = document.toObject();
		const blocksByItemId = await this.loadBlocksByItemId(
			documentId,
			transaction,
		);
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
		const writtenFieldKeys = new Set<string>();

		for (const change of changes) {
			const { id, matchedNodeId, type } = change.toObject();
			const matchedNode =
				matchedNodeId === null ? undefined : nodes.get(matchedNodeId);
			const fieldKeys =
				matchedNodeId === null
					? []
					: toWrittenFieldKeys(
							matchedNodeId,
							getIncomingFields(type, resolutionByChangeId.get(id)),
							resolutionByChangeId.get(id),
						);

			if (fieldKeys.some((fieldKey) => writtenFieldKeys.has(fieldKey))) {
				newChanges.push(change);
				continue;
			}

			for (const fieldKey of fieldKeys) {
				writtenFieldKeys.add(fieldKey);
			}

			if (matchedNode && matchedNodeId !== null) {
				const appliedNode = await this.applyToMatchedNode(
					{
						blocksByItemId,
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
			{
				blocksByItemId,
				changes: newChanges,
				document,
				overrideByChangeId,
				placements,
				userId,
			},
			transaction,
		);
	}
}

export { IntegrationAnalysisOutdatedError, IntegrationApplier };
