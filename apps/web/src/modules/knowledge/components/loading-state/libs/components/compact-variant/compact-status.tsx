import { DocumentStatus } from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";
import { type JSX } from "react";

import { Icon } from "~/components/components.js";
import { type ValueOf } from "~/lib/types/types.js";

import { ProgressCount, StatusChipTone } from "../../constants.js";
import {
	getCurrentProgress,
	getFailedUnitsText,
	getProgressLabel,
	getProgressPercentage,
	getProgressUnit,
	isReadyStatus,
	type ProgressStatus,
} from "../../helpers/processing-progress.helper.js";
import { StatusChip } from "../status-chip/status-chip.js";

type Properties = {
	currentStatus: ProgressStatus;
	progress: DocumentProcessingProgressDto | null;
};

const ChipIconSize = {
	CHECK: 14,
	CLOSE: 10,
	WARNING: 14,
} as const;

const getChipTone = (
	status: ProgressStatus,
): ValueOf<typeof StatusChipTone> => {
	if (status === DocumentStatus.FAILED) {
		return StatusChipTone.ERROR;
	}

	return isReadyStatus(status)
		? StatusChipTone.SUCCESS
		: StatusChipTone.NEUTRAL;
};

const getUnitsCount = (
	status: ProgressStatus,
	progress: DocumentProcessingProgressDto | null,
): null | string => {
	if (
		!progress ||
		progress.totalUnits === null ||
		status === DocumentStatus.FAILED
	) {
		return null;
	}

	const doneUnits = isReadyStatus(status)
		? Math.max(
				progress.processedUnits - progress.failedUnits,
				ProgressCount.EMPTY,
			)
		: progress.processedUnits;

	return `${String(doneUnits)} of ${String(progress.totalUnits)} ${getProgressUnit(progress)}`;
};

const ChipIcon = ({
	tone,
}: {
	tone: ValueOf<typeof StatusChipTone>;
}): JSX.Element => {
	if (tone === StatusChipTone.SUCCESS) {
		return <Icon name="toast-check" size={ChipIconSize.CHECK} />;
	}
	if (tone === StatusChipTone.ERROR) {
		return <Icon name="close" size={ChipIconSize.CLOSE} />;
	}

	return (
		<span className="size-3 rounded-full border-2 border-current/20 border-t-current motion-safe:animate-spin" />
	);
};

const CompactStatus = ({
	currentStatus,
	progress,
}: Properties): JSX.Element => {
	const current = getCurrentProgress(currentStatus, progress);
	const label = getProgressLabel(currentStatus, current);
	const tone = getChipTone(currentStatus);
	const unitsCount = getUnitsCount(currentStatus, current);
	const percentage = getProgressPercentage(current);
	const hasProgressBar = tone === StatusChipTone.NEUTRAL && percentage !== null;
	const hasFailedUnits =
		tone !== StatusChipTone.ERROR &&
		current !== null &&
		current.failedUnits > ProgressCount.EMPTY;

	return (
		<>
			<StatusChip icon={<ChipIcon tone={tone} />} tone={tone}>
				<span className="font-medium">{label}</span>
				{unitsCount && <span className="text-text">{`· ${unitsCount}`}</span>}
				{hasProgressBar && (
					<span
						aria-label={label}
						aria-valuemax={ProgressCount.FULL_PERCENTAGE}
						aria-valuemin={ProgressCount.EMPTY}
						aria-valuenow={percentage}
						aria-valuetext={`${unitsCount ?? ""} processed — ${String(percentage)}%`}
						className="ml-1 flex h-1 w-14 overflow-hidden rounded-full bg-control-inactive"
						role="progressbar"
					>
						<span
							className="h-full bg-accent transition-all duration-300"
							style={{ width: `${String(percentage)}%` }}
						/>
					</span>
				)}
			</StatusChip>
			{hasFailedUnits && (
				<StatusChip
					icon={<Icon name="warning" size={ChipIconSize.WARNING} />}
					title={getFailedUnitsText(current)}
					tone={StatusChipTone.ERROR}
				>
					<span aria-hidden="true">{`${String(current.failedUnits)} failed`}</span>
					<span className="sr-only">{getFailedUnitsText(current)}</span>
				</StatusChip>
			)}
		</>
	);
};

export { CompactStatus };
