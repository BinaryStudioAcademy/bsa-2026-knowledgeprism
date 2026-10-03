import { type ProposedMerge, type ProposedPage } from "../types/types.js";

const getCurrentMerge = (
	page: Pick<ProposedPage, "content" | "merge" | "title">,
): null | ProposedMerge => {
	const { content, merge, title } = page;

	return merge &&
		merge.incomingContent === content &&
		merge.incomingTitle === title
		? merge
		: null;
};

export { getCurrentMerge };
