const MIN_BATCH_SIZE = 1;
const FIRST_ITEM_INDEX = 0;

const splitIntoBatches = <T>(items: T[], batchSize: number): T[][] => {
	if (!Number.isSafeInteger(batchSize) || batchSize < MIN_BATCH_SIZE) {
		throw new Error(
			`Batch size must be a positive integer, got ${batchSize.toString()}`,
		);
	}

	const batches: T[][] = [];

	for (let index = FIRST_ITEM_INDEX; index < items.length; index += batchSize) {
		batches.push(items.slice(index, index + batchSize));
	}

	return batches;
};

export { splitIntoBatches };
