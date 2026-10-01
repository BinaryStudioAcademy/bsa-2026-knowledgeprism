import { type IntegrationChangesApplyRequestDto } from "@knowledgeprism/types";
import React, { useCallback, useMemo } from "react";

import { useAppDispatch, useAppSelector } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { isDocumentNode } from "../../libs/helpers/helpers.js";
import { type ProposedSection } from "../../libs/types/types.js";
import {
	getPipelineSessionId,
	isPipelineSessionCurrent,
} from "../../state/session-guards.js";
import { IntegrationPreview } from "../integration-preview/integration-preview.js";

type Properties = {
	documentId: number | undefined;
	extractionStructure: ProposedSection[];
	failedPageNumbers: number[];
	onAddMore: () => void;
	onApplyingChange: (isApplying: boolean) => void;
	onApprove: () => void;
	onCancelDocument: () => void;
	onClose: () => void;
	pipelineErrorMessage: null | string;
	projectId: null | string;
};

const IntegrationPreviewPanel: React.FC<Properties> = ({
	documentId,
	extractionStructure,
	failedPageNumbers,
	onAddMore,
	onApplyingChange,
	onApprove,
	onCancelDocument,
	onClose,
	pipelineErrorMessage,
	projectId,
}: Properties) => {
	const dispatch = useAppDispatch();
	const { integrationPreviewError, integrationPreviewSections, tree } =
		useAppSelector((state) => state.knowledge);
	const placementTargets = useMemo(
		() =>
			tree
				.filter((item) => isDocumentNode(item.type))
				.map(({ id, title }) => ({ id, title })),
		[tree],
	);

	const handleApply = useCallback(
		async (payload: IntegrationChangesApplyRequestDto): Promise<boolean> => {
			if (!projectId || documentId === undefined) {
				return false;
			}

			const pipelineSessionId = getPipelineSessionId();

			try {
				await dispatch(
					actions.applyIntegrationChanges({
						documentId,
						payload,
						pipelineSessionId,
						projectId,
					}),
				).unwrap();
			} catch {
				return false;
			}

			if (!isPipelineSessionCurrent(pipelineSessionId)) {
				return false;
			}

			onApprove();

			return true;
		},
		[dispatch, documentId, onApprove, projectId],
	);

	return (
		<div className="h-full w-full bg-bg">
			<IntegrationPreview
				errorMessage={pipelineErrorMessage ?? integrationPreviewError}
				failedPageNumbers={failedPageNumbers}
				key={String(documentId)}
				onAddMore={onAddMore}
				onApplyingChange={onApplyingChange}
				onApprove={handleApply}
				onCancelDocument={onCancelDocument}
				onClose={onClose}
				placementStructure={integrationPreviewSections}
				placementTargets={placementTargets}
				proposedStructure={extractionStructure}
			/>
		</div>
	);
};

export { IntegrationPreviewPanel };
