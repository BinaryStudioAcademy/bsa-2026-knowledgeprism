import { type IntegrationConflictResolutionDto } from "@knowledgeprism/types";
import React, { useCallback, useEffect } from "react";

import {
	Button,
	Loader,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { useAppDispatch, useAppSelector } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import { IntegrationPreview } from "../integration-preview/integration-preview.js";

const EMPTY_INTEGRATION_CHANGES_MESSAGE =
	"No integration changes were returned for this document.";
const MISSING_DOCUMENT_MESSAGE =
	"No document is available for integration preview.";

type Properties = {
	documentId: number | undefined;
	onAddMore: () => void;
	onApprove: () => void;
	onClose: () => void;
	projectId: null | string;
};

const IntegrationPreviewPanel: React.FC<Properties> = ({
	documentId,
	onAddMore,
	onApprove,
	onClose,
	projectId,
}: Properties) => {
	const dispatch = useAppDispatch();
	const {
		integrationPreviewError,
		integrationPreviewSections,
		isIntegrationPreviewLoading,
	} = useAppSelector((state) => state.knowledge);

	useEffect(() => {
		if (!projectId || documentId === undefined) {
			return;
		}

		void dispatch(actions.fetchIntegrationChanges({ documentId, projectId }));
	}, [dispatch, documentId, projectId]);

	const handleApply = useCallback(
		async (
			resolutions: IntegrationConflictResolutionDto[],
		): Promise<boolean> => {
			if (!projectId || documentId === undefined) {
				return false;
			}

			try {
				await dispatch(
					actions.applyIntegrationChanges({
						documentId,
						payload: { resolutions },
						projectId,
					}),
				).unwrap();
			} catch {
				return false;
			}

			onApprove();

			return true;
		},
		[dispatch, documentId, onApprove, projectId],
	);

	if (documentId === undefined) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-bg p-4">
				<Paragraph size={ParagraphSize.BODY_SMALL}>
					{MISSING_DOCUMENT_MESSAGE}
				</Paragraph>
				<Button onClick={onClose} variant="secondary">
					Back
				</Button>
			</div>
		);
	}

	if (isIntegrationPreviewLoading) {
		return (
			<div className="flex h-full w-full items-center justify-center bg-bg">
				<Loader size="lg" />
			</div>
		);
	}

	if (integrationPreviewError) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-bg p-4">
				<Paragraph size={ParagraphSize.BODY_SMALL}>
					{integrationPreviewError}
				</Paragraph>
				<Button onClick={onClose} variant="secondary">
					Back
				</Button>
			</div>
		);
	}

	if (integrationPreviewSections.length === EMPTY_LENGTH) {
		return (
			<div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-bg p-4">
				<Paragraph size={ParagraphSize.BODY_SMALL}>
					{EMPTY_INTEGRATION_CHANGES_MESSAGE}
				</Paragraph>
				<Button onClick={onClose} variant="secondary">
					Back
				</Button>
			</div>
		);
	}

	const previewKey = `${String(documentId)}-${String(integrationPreviewSections.length)}`;

	return (
		<div className="h-full w-full bg-bg">
			<IntegrationPreview
				key={previewKey}
				onAddMore={onAddMore}
				onApprove={handleApply}
				onClose={onClose}
				proposedStructure={integrationPreviewSections}
			/>
		</div>
	);
};

export { IntegrationPreviewPanel };
