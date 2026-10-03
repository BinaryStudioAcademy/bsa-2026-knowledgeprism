import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX } from "react";

import { Button } from "~/components/components.js";

import { isReadyStatus } from "../../helpers/processing-progress.helper.js";
import { type InternalVariantProperties } from "../../types.js";
import { CompactStatus } from "./compact-status.js";

const CompactVariant = ({
	currentStatus,
	errorMessage,
	isError,
	onCancel,
	onPreview,
	onRetry,
	progress,
}: InternalVariantProperties): JSX.Element => {
	const isReady = isReadyStatus(currentStatus);
	return (
		<div className="flex w-full flex-col gap-1.5">
			<div className="flex flex-wrap items-center gap-2.5">
				<CompactStatus
					currentStatus={isError ? DocumentStatus.FAILED : currentStatus}
					progress={progress ?? null}
				/>
				{isError ? (
					<>
						<Button className="ml-1" onClick={onRetry} variant="secondary">
							Retry
						</Button>
						<Button onClick={onCancel} variant="ghost">
							Cancel
						</Button>
					</>
				) : (
					isReady && (
						<Button className="ml-1" onClick={onPreview} variant="accent">
							{currentStatus === DocumentStatus.WAITING_FOR_VALIDATION
								? "Review extraction"
								: "Review integration"}
						</Button>
					)
				)}
			</div>
			{isError && errorMessage && (
				<p className="w-0 min-w-full text-sm font-medium text-error">
					{errorMessage}
				</p>
			)}
		</div>
	);
};
export { CompactVariant };
