import {
	DocumentProcessingPhase,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";

import { type ValueOf } from "~/lib/types/types.js";

import { ProgressCount } from "../constants.js";

type Progress = DocumentProcessingProgressDto | null;

type ProgressStatus = "IDLE" | ValueOf<typeof DocumentStatus>;

const isReadyStatus = (status: ProgressStatus): boolean => {
	return (
		status === DocumentStatus.WAITING_FOR_VALIDATION ||
		status === DocumentStatus.WAITING_FOR_APPROVAL
	);
};

const getCurrentProgress = (
	status: ProgressStatus,
	progress: Progress,
): Progress => {
	const isIntegration =
		status === DocumentStatus.INTEGRATING ||
		status === DocumentStatus.WAITING_FOR_APPROVAL;
	const isMatchingPhase =
		!progress ||
		isIntegration ===
			(progress.phase === DocumentProcessingPhase.INTEGRATING) ||
		status === DocumentStatus.FAILED;

	return isMatchingPhase ? progress : null;
};

const getProgressLabel = (
	status: ProgressStatus,
	progress: Progress,
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

const getProgressPercentage = (progress: Progress): null | number => {
	return progress?.totalUnits
		? Math.floor(
				(progress.processedUnits / progress.totalUnits) *
					ProgressCount.FULL_PERCENTAGE,
			)
		: null;
};

const getProgressUnit = (progress: Progress): "chunks" | "items" => {
	return progress?.phase === DocumentProcessingPhase.INTEGRATING
		? "items"
		: "chunks";
};

const getFailedUnitsText = (
	progress: DocumentProcessingProgressDto,
): string => {
	const unit = getProgressUnit(progress);
	const failedUnit =
		progress.failedUnits === ProgressCount.SINGLE
			? unit.slice(ProgressCount.EMPTY, -ProgressCount.SINGLE)
			: unit;

	return `${String(progress.failedUnits)} ${failedUnit} failed or incomplete`;
};

export {
	type ProgressStatus,
	getCurrentProgress,
	getFailedUnitsText,
	getProgressLabel,
	getProgressPercentage,
	getProgressUnit,
	isReadyStatus,
};
