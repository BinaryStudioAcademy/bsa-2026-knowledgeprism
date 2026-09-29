const EMPTY_LENGTH = 0;

// Groups block texts into as few batches as possible, each batch's joined length staying
// within `maxLength`, so the caller sends the fewest possible check-consistency requests. A
// text longer than `maxLength` on its own can never fit any batch and is silently dropped;
// the caller is responsible for treating a dropped text as "checked, no matches".
const batchGlossaryCheckTexts = (
	texts: readonly string[],
	maxLength: number,
	joinSeparator: string,
): string[][] => {
	const batches: string[][] = [];
	let currentBatch: string[] = [];
	let currentLength = EMPTY_LENGTH;

	for (const text of texts) {
		if (text.length > maxLength) {
			continue;
		}

		const lengthWithText =
			currentBatch.length === EMPTY_LENGTH
				? text.length
				: currentLength + joinSeparator.length + text.length;

		if (lengthWithText > maxLength) {
			batches.push(currentBatch);
			currentBatch = [text];
			currentLength = text.length;
		} else {
			currentBatch.push(text);
			currentLength = lengthWithText;
		}
	}

	if (currentBatch.length > EMPTY_LENGTH) {
		batches.push(currentBatch);
	}

	return batches;
};

export { batchGlossaryCheckTexts };
