import { DocumentStatus } from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";
import { type JSX } from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { ProgressCount } from "../constants.js";
import {
	getCurrentProgress,
	getFailedUnitsText,
	getProgressLabel,
	getProgressPercentage,
	getProgressUnit,
	isReadyStatus,
	type ProgressStatus,
} from "../helpers/processing-progress.helper.js";

type Properties = {
	currentStatus: ProgressStatus;
	progress?: DocumentProcessingProgressDto | null;
};

const ProcessingProgress = ({
	currentStatus,
	progress = null,
}: Properties): JSX.Element => {
	const current = getCurrentProgress(currentStatus, progress);
	const percentage = getProgressPercentage(current);
	const failedPercentage =
		percentage !== null && current?.totalUnits
			? Math.min(
					(current.failedUnits / current.totalUnits) *
						ProgressCount.FULL_PERCENTAGE,
					percentage,
				)
			: ProgressCount.EMPTY;
	const succeededPercentage =
		percentage === null ? null : percentage - failedPercentage;
	const label = getProgressLabel(currentStatus, current);
	const unit = getProgressUnit(current);
	const isReady = isReadyStatus(currentStatus);
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
			{current && current.failedUnits > ProgressCount.EMPTY && (
				<p className="font-medium text-error">{getFailedUnitsText(current)}</p>
			)}
			{(!isReady || percentage !== null) && (
				<div
					aria-label={label}
					aria-valuemax={ProgressCount.FULL_PERCENTAGE}
					aria-valuemin={ProgressCount.EMPTY}
					aria-valuenow={percentage ?? undefined}
					aria-valuetext={details ?? label}
					className="flex h-1.5 w-full overflow-hidden rounded-full bg-border-subtle"
					role="progressbar"
				>
					<div
						className={getValidClassNames(
							"h-full bg-accent transition-all duration-300",
							{
								"bg-error": isFailed,
								"w-full motion-safe:animate-pulse":
									percentage === null && !isFailed,
							},
						)}
						style={
							succeededPercentage === null
								? undefined
								: { width: `${String(succeededPercentage)}%` }
						}
					/>
					{failedPercentage > ProgressCount.EMPTY && (
						<div
							className="h-full bg-error transition-all duration-300"
							style={{ width: `${String(failedPercentage)}%` }}
						/>
					)}
				</div>
			)}
		</div>
	);
};
export { ProcessingProgress };
