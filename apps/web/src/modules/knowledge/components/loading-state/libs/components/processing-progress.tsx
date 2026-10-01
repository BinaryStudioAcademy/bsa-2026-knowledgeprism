import {
	DocumentProcessingPhase,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";
import { type JSX } from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

type Properties = {
	currentStatus: "IDLE" | ValueOf<typeof DocumentStatus>;
	progress?: DocumentProcessingProgressDto | null;
};
const FULL_PERCENTAGE = 100;
const EMPTY_COUNT = 0;
const SINGLE_UNIT = 1;

const getProgressLabel = (
	status: Properties["currentStatus"],
	progress: Properties["progress"],
): string => {
	if (status === DocumentStatus.WAITING_FOR_VALIDATION) {
		return "Ready for review";
	}
	if (status === DocumentStatus.WAITING_FOR_APPROVAL) {
		return "Ready for approval";
	}
	if (status === DocumentStatus.FAILED) {
		return "Processing failed";
	}
	if (status === DocumentStatus.COMPLETED) {
		return "Published";
	}
	if (status === DocumentStatus.INTEGRATING) {
		return "Analyzing integration";
	}
	if (progress?.phase === DocumentProcessingPhase.EXTRACTING) {
		return "Extracting knowledge";
	}
	return "Reading document";
};

const ProcessingProgress = ({
	currentStatus,
	progress = null,
}: Properties): JSX.Element => {
	const isIntegration =
		currentStatus === DocumentStatus.INTEGRATING ||
		currentStatus === DocumentStatus.WAITING_FOR_APPROVAL;
	const isMatchingPhase =
		!progress ||
		isIntegration ===
			(progress.phase === DocumentProcessingPhase.INTEGRATING) ||
		currentStatus === DocumentStatus.FAILED;
	const current = isMatchingPhase ? progress : null;
	const percentage = current?.totalUnits
		? Math.floor(
				(current.processedUnits / current.totalUnits) * FULL_PERCENTAGE,
			)
		: null;
	const label = getProgressLabel(currentStatus, current);
	const unit =
		current?.phase === DocumentProcessingPhase.INTEGRATING ? "items" : "chunks";
	const failedUnit =
		current?.failedUnits === SINGLE_UNIT
			? unit.slice(EMPTY_COUNT, -SINGLE_UNIT)
			: unit;
	const isReady =
		currentStatus === DocumentStatus.WAITING_FOR_VALIDATION ||
		currentStatus === DocumentStatus.WAITING_FOR_APPROVAL;
	const isFailed = currentStatus === DocumentStatus.FAILED;
	const percentageText = percentage === null ? "" : ` — ${String(percentage)}%`;
	const details =
		!current || current.totalUnits === null
			? null
			: `${String(current.processedUnits)} of ${String(current.totalUnits)} ${unit} processed${percentageText}`;
	return (
		<div className="flex w-full flex-col gap-1 text-sm">
			<p>
				{label}
				{details ? `: ${details}` : ""}
			</p>
			{current && current.failedUnits > EMPTY_COUNT && (
				<p className="font-medium text-error">
					{current.failedUnits} {failedUnit} failed or incomplete
				</p>
			)}
			{(!isReady || percentage !== null) && (
				<div
					aria-label={label}
					aria-valuemax={FULL_PERCENTAGE}
					aria-valuemin={EMPTY_COUNT}
					aria-valuenow={percentage ?? undefined}
					aria-valuetext={details ?? label}
					className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
					role="progressbar"
				>
					<div
						className={getValidClassNames(
							"h-full bg-accent transition-all duration-300",
							{
								"bg-error": isFailed || Boolean(current?.failedUnits),
								"w-full motion-safe:animate-pulse":
									percentage === null && !isFailed,
							},
						)}
						style={
							percentage === null
								? undefined
								: { width: `${String(percentage)}%` }
						}
					/>
				</div>
			)}
		</div>
	);
};
export { ProcessingProgress };
