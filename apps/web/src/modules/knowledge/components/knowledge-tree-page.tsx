import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import {
	useAppDispatch,
	useAppSelector,
	useCanWriteKnowledge,
	useCurrentProjectId,
} from "~/hooks/hooks.js";

import { actions } from "../knowledge.js";
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
	const { pipelineProjectId, selectedEntry, tree } = useAppSelector(
		(state) => state.knowledge,
	);

	const [manualSelection, setManualSelection] =
		useState<ManualSelection | null>(null);
	const [fetchedProjectId, setFetchedProjectId] = useState<null | string>(null);

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
		manualSelection.queryNodeId === queryNodeId
			? manualSelection.pageId
			: undefined;

	const activePageId =
		manualSelectedPageId ?? targetPage?.id ?? firstAvailablePage?.id;

	useEffect(() => {
		if (activePageId === undefined || !projectId) {
			return;
		}

		const request = dispatch(
			actions.fetchKnowledgeEntry({ entryId: activePageId, projectId }),
		);

		return () => {
			request.abort();
		};
	}, [dispatch, activePageId, projectId]);

	const handleSelectPage = useCallback(
		(id: number) => {
			setManualSelection({ pageId: id, projectId, queryNodeId });
		},
		[projectId, queryNodeId],
	);

	const entries = useMemo(() => {
		if (!selectedEntry) {
			return {};
		}
		return { [selectedEntry.id]: selectedEntry };
	}, [selectedEntry]);

	return (
		<KnowledgeTreeLayout
			canEdit={canWriteKnowledge}
			entries={entries}
			isTreeReady={isTreeReady}
			items={tree}
			onSelectPage={handleSelectPage}
			selectedPageId={activePageId}
		/>
	);
};

export { KnowledgeTreePage };
