import { type DocumentProcessingProgressDto } from "@knowledgeprism/types";

import { ProcessingSupersededError } from "~/modules/documents/libs/exceptions/processing-superseded-error.exception.js";

const NO_REPORTED_UNITS = -1;

const createOrderedProgressReporter = (
	save: (progress: DocumentProcessingProgressDto) => Promise<boolean>,
): ((progress: DocumentProcessingProgressDto) => Promise<void>) => {
	let lastReportedUnits = NO_REPORTED_UNITS;
	let pendingReport = Promise.resolve();

	const saveAfter = async (
		previousReport: Promise<void>,
		progress: DocumentProcessingProgressDto,
	): Promise<void> => {
		await previousReport;

		if (progress.processedUnits < lastReportedUnits) {
			return;
		}

		lastReportedUnits = progress.processedUnits;

		if (!(await save(progress))) {
			throw new ProcessingSupersededError();
		}
	};

	return (progress) => {
		pendingReport = saveAfter(pendingReport, progress);

		return pendingReport;
	};
};

export { createOrderedProgressReporter };
