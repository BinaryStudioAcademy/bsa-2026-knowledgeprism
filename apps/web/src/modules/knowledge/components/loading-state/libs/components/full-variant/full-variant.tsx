import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX } from "react";

import { Button, Heading, Loader } from "~/components/components.js";

import { type InternalVariantProperties } from "../../types.js";
import { ProcessingProgress } from "../processing-progress.js";

const FullVariant = ({
	currentStatus,
	errorMessage,
	isError,
	onCancel,
	onRetry,
	progress,
}: InternalVariantProperties): JSX.Element => {
	const isReady =
		currentStatus === DocumentStatus.WAITING_FOR_VALIDATION ||
		currentStatus === DocumentStatus.WAITING_FOR_APPROVAL;
	const heading = isReady ? "Processing finished" : "Analyzing your content";
	return (
		<div className="flex w-full max-w-lg flex-col items-center gap-6 rounded-lg p-10 text-center">
			{!isReady && !isError && <Loader size="lg" />}
			<Heading level="1">{isError ? "Processing failed" : heading}</Heading>
			<ProcessingProgress
				currentStatus={isError ? DocumentStatus.FAILED : currentStatus}
				progress={progress ?? null}
			/>
			{isReady && (
				<p className="text-sm text-text-muted">
					{currentStatus === DocumentStatus.WAITING_FOR_VALIDATION
						? "Review the extracted knowledge before integration."
						: "Review and approve the proposed changes before publication."}
				</p>
			)}
			{isError && errorMessage && (
				<p className="text-sm text-text-muted">{errorMessage}</p>
			)}
			{isError && (
				<div className="flex gap-3">
					<Button onClick={onCancel} variant="secondary">
						Cancel
					</Button>
					<Button onClick={onRetry} variant="primary">
						Retry
					</Button>
				</div>
			)}
		</div>
	);
};
export { FullVariant };
