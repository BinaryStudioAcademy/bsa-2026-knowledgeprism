const SINGLE_PAGE_COUNT = 1;

const toFailedPagesMessage = (pageNumbers: readonly number[]): string =>
	pageNumbers.length === SINGLE_PAGE_COUNT
		? `Page ${pageNumbers.join("")} could not be processed, so items from it may be missing.`
		: `Pages ${pageNumbers.join(", ")} could not be processed, so items from them may be missing.`;

export { toFailedPagesMessage };
