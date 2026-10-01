import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX } from "react";

import { Button } from "~/components/components.js";

import { type InternalVariantProperties } from "../../types.js";
import { ProcessingProgress } from "../processing-progress.js";

const CompactVariant = ({
	currentStatus,
	errorMessage,
	isError,
	onCancel,
	onPreview,
	onRetry,
	progress,
}: InternalVariantProperties): JSX.Element => {
	const isReady =
		currentStatus === DocumentStatus.WAITING_FOR_VALIDATION ||
		currentStatus === DocumentStatus.WAITING_FOR_APPROVAL;
	return (
		<div className="flex w-full min-w-65 flex-col gap-2">
			<ProcessingProgress
				currentStatus={isError ? DocumentStatus.FAILED : currentStatus}
				progress={progress ?? null}
			/>
			{isError && errorMessage && (
				<p className="text-sm font-medium text-error">{errorMessage}</p>
			)}
			{isError ? (
				<div className="flex gap-2">
					<Button onClick={onRetry} variant="secondary">
						Retry
					</Button>
					<Button onClick={onCancel} variant="ghost">
						Cancel
					</Button>
				</div>
			) : (
				isReady && (
					<Button onClick={onPreview} variant="accent">
						{currentStatus === DocumentStatus.WAITING_FOR_VALIDATION
							? "Review extraction"
							: "Review integration"}
					</Button>
				)
			)}
		</div>
	);
};
export { CompactVariant };
