import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX } from "react";

import { Button, Heading, Loader } from "~/components/components.js";

import { type InternalVariantProperties } from "../../types.js";
import { ProcessingProgress } from "../processing-progress.js";
import "./full-variant.css";

const FAILED_HEADING = "Processing failed";
const GENERIC_FAILURE_DETAIL = "Something went wrong. Please try again.";

const toFailureDetail = (errorMessage: null | string | undefined): string =>
	errorMessage && errorMessage !== FAILED_HEADING
		? errorMessage
		: GENERIC_FAILURE_DETAIL;

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
		<div className="analyzing-full-state mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-6 rounded-lg p-10 text-center">
			{!isReady && !isError && <Loader size="lg" />}
			<Heading level="1">{isError ? FAILED_HEADING : heading}</Heading>
			<ProcessingProgress
				currentStatus={isError ? DocumentStatus.FAILED : currentStatus}
				progress={progress ?? null}
			/>
			{isError && (
				<p className="text-sm text-text-muted">
					{toFailureDetail(errorMessage)}
				</p>
			)}
			{isReady && (
				<p className="text-sm text-text-muted">
					{currentStatus === DocumentStatus.WAITING_FOR_VALIDATION
						? "Review the extracted knowledge before integration."
						: "Review and approve the proposed changes before publication."}
				</p>
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
			{!isError && !isReady && onCancel && (
				<div className="flex gap-3">
					<Button onClick={onCancel} variant="secondary">
						Cancel
					</Button>
				</div>
			)}
		</div>
	);
};
export { FullVariant };
