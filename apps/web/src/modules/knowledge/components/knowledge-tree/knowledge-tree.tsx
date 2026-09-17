import { type JSX, useCallback } from "react";

import {
	Button,
	Heading,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { useNavigate } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";

import { useKnowledgeProcessing } from "../../hooks/use-knowledge-processing.js";
import { LoadingState } from "../loading-state/loading-state.js";

type KnowledgeTreeProperties = {
	canManageKnowledge?: boolean;
	hasKnowledgeEntries?: boolean;
	isInitiator?: boolean;
	isProcessing?: boolean;
	isProcessingError?: boolean;
	onCancelProcessing?: () => void;
	onRetryProcessing?: () => void;
};

const KnowledgeTree: React.FC<KnowledgeTreeProperties> = ({
	canManageKnowledge = true,
	hasKnowledgeEntries = false,
	isInitiator: propertyIsInitiator,
	isProcessing: propertyIsProcessing,
	isProcessingError: propertyIsError,
	onCancelProcessing: propertyOnCancel,
	onRetryProcessing: propertyOnRetry,
}: KnowledgeTreeProperties): JSX.Element => {
	const navigate = useNavigate();
	const processing = useKnowledgeProcessing("current-user-id");

	const isInitiator = propertyIsInitiator ?? processing.isInitiator;
	const isProcessing = propertyIsProcessing ?? processing.state.isProcessing;
	const isProcessingError = propertyIsError ?? processing.state.error;
	const onCancelProcessing = propertyOnCancel ?? processing.cancelProcessing;
	const onRetryProcessing = propertyOnRetry ?? processing.retryProcessing;

	const handleAddKnowledge = useCallback((): void => {
		void navigate(AppRoute.KNOWLEDGE_ADD);
	}, [navigate]);

	const handlePreview = useCallback((): void => {}, []);

	return (
		<div className="flex h-full w-full flex-col gap-4 p-6">
			{isInitiator && (isProcessing || isProcessingError) && (
				<div className="w-full max-w-xl rounded-lg border border-border bg-surface p-4 shadow-sm">
					{isProcessingError ? (
						<LoadingState
							hasError
							onCancel={onCancelProcessing}
							onRetry={onRetryProcessing}
							variant="compact"
						/>
					) : (
						<LoadingState onPreview={handlePreview} variant="compact" />
					)}
				</div>
			)}

			{hasKnowledgeEntries ? (
				<div className="flex flex-1 gap-6">
					<aside className="w-64 border-r border-border pr-4">
						<Heading level="3">Tree Structure</Heading>
					</aside>
					<main className="flex-1">
						<Paragraph>
							Knowledge tree content is available and editable.
						</Paragraph>
					</main>
				</div>
			) : (
				<div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
					<Heading level="2">No knowledge added yet</Heading>
					<Paragraph
						className="text-text-muted"
						size={ParagraphSize.BODY_SMALL}
					>
						Click &apos;Add Knowledge&apos; to start.
					</Paragraph>
					{canManageKnowledge && (
						<Button onClick={handleAddKnowledge} variant="primary">
							Add Knowledge
						</Button>
					)}
				</div>
			)}
		</div>
	);
};

export { KnowledgeTree };
