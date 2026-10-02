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
import {
	createInvalidIncomingPlacementError,
	planIntegrationEntries,
} from "~/modules/documents/libs/helpers/plan-integration-entries.helper.js";
import { toKnowledgeContentJson } from "~/modules/documents/libs/helpers/to-knowledge-content-json.helper.js";
import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";
import { isDocumentNode } from "~/modules/knowledge/libs/helpers/plan-document-placement.helper.js";
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
const FIRST_CHILD_POSITION = 0;

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

const withDroppedDuplicateParents = (
	placements: Placement[],
	{
		changes,
		createdChanges,
	}: {
		changes: IntegrationChangeEntity[];
		createdChanges: IntegrationChangeEntity[];
	},
): Placement[] => {
	const earlierItemIdByDroppedItemId = new Map(
		changes
			.filter((change) => !createdChanges.includes(change))
			.flatMap((change) => {
				const { duplicateOfExtractionItemId, extractionItemId } =
					change.toObject();

				return duplicateOfExtractionItemId == null
					? []
					: [[extractionItemId, duplicateOfExtractionItemId] as const];
			}),
	);

	return placements.map((placement) => {
		const earlierItemId =
			placement.parentExtractionItemId == null
				? undefined
				: earlierItemIdByDroppedItemId.get(placement.parentExtractionItemId);

		return earlierItemId === undefined
			? placement
			: { ...placement, parentExtractionItemId: earlierItemId };
	});
};

const isEarlierSectionDuplicate = (
	duplicateOfExtractionItemId: null | number | undefined,
): boolean => {
	return duplicateOfExtractionItemId != null;
};

const isIncomingKept = (
	resolution: IntegrationConflictResolutionDto | undefined,
): boolean => {
	return [resolution?.content, resolution?.title].some(
		(choice) =>
			choice === IntegrationResolution.USE_NEW ||
			choice === IntegrationResolution.BOTH,
	);
};

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
			const nextTitle = getIncomingFields(type, resolution).title
				? incomingTitle
				: title;
			const liveText = flattenContentToText(contentJson);
			const span =
				placement.matches[resolution.matchIndex ?? FIRST_MATCH_INDEX]?.span ??
				placement.matches[FIRST_MATCH_INDEX]?.span ??
				"";
			const nextText = appendIncomingAtSpan(liveText, incomingContent, span);
			const appliedNode =
				nextText === liveText && nextTitle === title
					? node
					: await this.knowledgeNodeRepository.update(
							{
								contentJson: toContentJson(nextText),
								id,
								title: nextTitle,
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
			existingNodeIdsByItemId,
			knownChangeIds,
			overrideByChangeId,
			placements,
			userId,
		}: Pick<
			ApplyParameters,
			"changes" | "document" | "placements" | "userId"
		> & {
			blocksByItemId: Map<number, ExtractionContentBlock[]>;
			existingNodeIdsByItemId: ReadonlyMap<number, number>;
			knownChangeIds: ReadonlySet<number>;
			overrideByChangeId: Map<number, IntegrationChangeContentOverrideDto>;
		},
		transaction: Transaction,
	): Promise<void> {
		const entries = planIntegrationEntries({
			changes,
			existingParentItemIds: new Set(existingNodeIdsByItemId.keys()),
			knownChangeIds,
			placements,
		});

		if (entries.length === EMPTY_LENGTH) {
			return;
		}

		const { projectId } = document.toObject();
		const nextPositionByParentId = await this.findChosenParents(
			entries.map(({ change, parentExtractionItemId, parentId, position }) => ({
				changeId: change.toObject().id,
				parentExtractionItemId,
				parentId,
				position,
			})),
			projectId,
			existingNodeIdsByItemId,
		);
		let documentPageId: null | number = null;
		const nodeIdsByItemId = new Map(existingNodeIdsByItemId);

		for (const {
			change,
			parentExtractionItemId,
			parentId: chosenParentId,
		} of entries) {
			const { extractionItemId, id } = change.toObject();
			let parentId: number;

			if (parentExtractionItemId !== null) {
				const incomingParentId = nodeIdsByItemId.get(parentExtractionItemId);

				if (incomingParentId === undefined) {
					throw createInvalidIncomingPlacementError();
				}

				parentId = incomingParentId;
			} else if (chosenParentId === null) {
				documentPageId ??= await this.createDocumentPage(
					{ document, userId },
					transaction,
				);
				parentId = documentPageId;
			} else {
				parentId = chosenParentId;
			}
			const position =
				nextPositionByParentId.get(parentId) ?? FIRST_CHILD_POSITION;
			nextPositionByParentId.set(parentId, position + NEXT_POSITION_OFFSET);

			const knowledgeNodeId = await this.createEntry(
				{
					blocks: blocksByItemId.get(extractionItemId) ?? [],
					change,
					override: overrideByChangeId.get(id),
					parentId,
					position,
					projectId,
					userId,
				},
				transaction,
			);

			nodeIdsByItemId.set(extractionItemId, knowledgeNodeId);
		}
	}

	private async createEntry(
		{
			blocks,
			change,
			override,
			parentId,
			position,
			projectId,
			userId,
		}: {
			blocks: ExtractionContentBlock[];
			change: IntegrationChangeEntity;
			override: IntegrationChangeContentOverrideDto | undefined;
			parentId: number;
			position: number;
			projectId: number;
			userId: number;
		},
		transaction: Transaction,
	): Promise<number> {
		const { incomingContent, incomingTitle } = resolveIncoming(
			change,
			override,
		);
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
		const knowledgeNodeId = entryNode.toObject().id;
		await this.extractionItemRepository.linkKnowledgeNode(
			{ id: change.toObject().extractionItemId, knowledgeNodeId },
			transaction,
		);

		return knowledgeNodeId;
	}

	private async findChosenParents(
		placements: Placement[],
		projectId: number,
		existingNodeIdsByItemId: ReadonlyMap<number, number>,
	): Promise<Map<number, number>> {
		const parents = placements.flatMap(
			({ parentExtractionItemId, parentId }) => {
				const isIncomingParent = parentExtractionItemId != null;
				const id = isIncomingParent
					? existingNodeIdsByItemId.get(parentExtractionItemId)
					: parentId;

				return id == null ? [] : [{ id, isIncomingParent }];
			},
		);
		const nodes =
			parents.length === EMPTY_LENGTH
				? []
				: await this.knowledgeNodeRepository.findAllByProjectId(projectId);
		const nextPositionByParentId = new Map<number, number>();

		for (const { id: parentId, isIncomingParent } of parents) {
			const parent = nodes.find((node) => node.toObject().id === parentId);

			if (
				!parent ||
				(!isIncomingParent && !isDocumentNode(parent.toObject().type))
			) {
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
			const { duplicateOfExtractionItemId, matchedNodeId, type } =
				change.toObject();

			if (
				type === IntegrationChangeType.NEW ||
				isEarlierSectionDuplicate(duplicateOfExtractionItemId)
			) {
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
		const isDuplicate = (change: IntegrationChangeEntity): boolean =>
			isEarlierSectionDuplicate(change.toObject().duplicateOfExtractionItemId);
		const analyzedChanges = changes.filter((change) => !isDuplicate(change));
		const newChanges: IntegrationChangeEntity[] = changes.filter(
			(change) =>
				isDuplicate(change) &&
				isIncomingKept(resolutionByChangeId.get(change.toObject().id)),
		);
		const existingNodeIdsByItemId = new Map<number, number>();
		const writtenFieldKeys = new Set<string>();

		for (const change of analyzedChanges) {
			const { extractionItemId, id, matchedNodeId, type } = change.toObject();
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
				existingNodeIdsByItemId.set(extractionItemId, matchedNodeId);
			} else {
				newChanges.push(change);
			}
		}

		await this.createEntries(
			{
				blocksByItemId,
				changes: newChanges,
				document,
				existingNodeIdsByItemId,
				knownChangeIds: new Set(changes.map((change) => change.toObject().id)),
				overrideByChangeId,
				placements: withDroppedDuplicateParents(placements, {
					changes,
					createdChanges: newChanges,
				}),
				userId,
			},
			transaction,
		);
	}
}

export { IntegrationAnalysisOutdatedError, IntegrationApplier };
