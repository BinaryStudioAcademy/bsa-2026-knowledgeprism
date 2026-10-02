import { type KnowledgeEntryResponseDto } from "@knowledgeprism/types";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
	useAppDispatch,
	useAppSelector,
	useCanWriteKnowledge,
	useCurrentProjectId,
} from "~/hooks/hooks.js";

import { actions } from "../knowledge.js";
import { resolveApprovedDocumentView } from "../libs/helpers/resolve-approved-document-view.helper.js";
import { KnowledgeTreeLayout } from "./knowledge-tree/knowledge-tree-layout.js";

type ManualSelection = {
	pageId: number;
	projectId: null | string;
	queryNodeId: null | string;
};

const KnowledgeTreePage: React.FC = () => {
	const projectId = useCurrentProjectId();
	const dispatch = useAppDispatch();
	const [searchParameters] = useSearchParams();
	const canWriteKnowledge = useCanWriteKnowledge();
	const {
		pipelineProjectId,
		removedOpenDocument,
		selectedEntry,
		tree,
		treeRevision,
	} = useAppSelector((state) => state.knowledge);

	const [manualSelection, setManualSelection] =
		useState<ManualSelection | null>(null);
	const [fetchedProjectId, setFetchedProjectId] = useState<null | string>(null);
	const [relatedEntries, setRelatedEntries] = useState<
		Record<number, KnowledgeEntryResponseDto>
	>({});
	const [relatedRequestKey, setRelatedRequestKey] = useState<null | string>(
		null,
	);

	const queryNodeId = searchParameters.get("nodeId");
	const parsedNodeId = queryNodeId ? Number(queryNodeId) : undefined;
	const validTargetNodeId =
		parsedNodeId !== undefined && !Number.isNaN(parsedNodeId)
			? parsedNodeId
			: undefined;

	useEffect(() => {
		if (!projectId || pipelineProjectId !== projectId) {
			return;
		}

		let isCurrentRequest = true;
		const request = dispatch(actions.fetchKnowledgeTree({ projectId }));

		void request
			.unwrap()
			.catch(() => {
				// The store owns the visible tree error.
			})
			.finally(() => {
				if (isCurrentRequest) {
					setFetchedProjectId(projectId);
				}
			});

		return () => {
			isCurrentRequest = false;
			request.abort();
		};
	}, [dispatch, pipelineProjectId, projectId]);

	const isTreeReady = fetchedProjectId === projectId;
	const parentIds = new Set(tree.map((item) => item.parentId));
	const firstAvailablePage = isTreeReady
		? tree.find(
				(item) =>
					(item.type === "PAGE" || item.type === "ENTRY") &&
					!parentIds.has(item.id),
			)
		: undefined;

	const targetPage =
		isTreeReady && validTargetNodeId !== undefined
			? tree.find((item) => item.id === validTargetNodeId)
			: undefined;
	const manualSelectedPageId =
		manualSelection?.projectId === projectId &&
		manualSelection.queryNodeId === queryNodeId &&
		tree.some((item) => item.id === manualSelection.pageId)
			? manualSelection.pageId
			: undefined;

	const isOpenDocumentRemoved =
		removedOpenDocument?.projectId === projectId &&
		removedOpenDocument.queryNodeId === queryNodeId;
	const fallbackPageId =
		manualSelectedPageId ?? targetPage?.id ?? firstAvailablePage?.id;
	const activePageId = isOpenDocumentRemoved ? undefined : fallbackPageId;
	const documentView = useMemo(
		() => resolveApprovedDocumentView(tree, activePageId),
		[activePageId, tree],
	);
	const documentId = documentView?.documentId;
	const relatedKey =
		!projectId || documentView == null
			? null
			: [
					projectId,
					String(treeRevision),
					String(documentView.documentId),
					documentView.sectionIds.join(","),
				].join(":");
	const isSectionsLoading =
		relatedKey !== null && relatedRequestKey !== relatedKey;

	useEffect(() => {
		if (activePageId === undefined || !projectId || documentId !== undefined) {
			return;
		}

		const request = dispatch(
			actions.fetchKnowledgeEntry({ entryId: activePageId, projectId }),
		);

		return () => {
			request.abort();
		};
	}, [dispatch, activePageId, projectId, treeRevision, documentId]);

	useEffect(() => {
		if (!projectId || documentId === undefined || relatedKey === null) {
			return;
		}

		const requestKey = relatedKey;
		let isCurrent = true;
		const request = dispatch(
			actions.fetchDocumentSections({ documentId, projectId }),
		);

		void request
			.unwrap()
			.then(({ items }) => {
				if (!isCurrent) {
					return;
				}

				setRelatedEntries(
					Object.fromEntries(items.map((entry) => [entry.id, entry])),
				);
				setRelatedRequestKey(requestKey);
			})
			.catch(() => {
				if (!isCurrent) {
					return;
				}

				setRelatedEntries({});
				setRelatedRequestKey(requestKey);
			});

		return () => {
			isCurrent = false;
			request.abort();
		};
	}, [dispatch, documentId, projectId, relatedKey]);

	const handleSelectPage = useCallback(
		(id: number) => {
			dispatch(actions.clearRemovedOpenDocument());
			setManualSelection({ pageId: id, projectId, queryNodeId });
		},
		[dispatch, projectId, queryNodeId],
	);

	const entries = useMemo(() => {
		const merged =
			relatedRequestKey === relatedKey ? { ...relatedEntries } : {};

		if (
			selectedEntry &&
			(documentId === undefined || relatedRequestKey === relatedKey)
		) {
			merged[selectedEntry.id] = selectedEntry;
		}

		return merged;
	}, [
		documentId,
		relatedEntries,
		relatedKey,
		relatedRequestKey,
		selectedEntry,
	]);

	return (
		<KnowledgeTreeLayout
			canEdit={canWriteKnowledge}
			entries={entries}
			isSectionsLoading={isSectionsLoading}
			isTreeReady={isTreeReady}
			items={tree}
			onSelectPage={handleSelectPage}
			selectedPageId={activePageId}
		/>
	);
};

export { KnowledgeTreePage };
