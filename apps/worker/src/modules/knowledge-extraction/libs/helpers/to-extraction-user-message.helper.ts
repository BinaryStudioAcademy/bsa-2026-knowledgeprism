import {
	PAGE_CONTENT_TAG,
	PREVIOUS_HEADING_TAG,
} from "../constants/extraction-prompt.constant.js";

const toExtractionUserMessage = (
	content: string,
	previousHeading: null | string,
): string => {
	const page = `<${PAGE_CONTENT_TAG}>\n${content}\n</${PAGE_CONTENT_TAG}>`;

	if (previousHeading === null || previousHeading.trim() === "") {
		return page;
	}

	return `<${PREVIOUS_HEADING_TAG}>${previousHeading}</${PREVIOUS_HEADING_TAG}>\n${page}`;
};

export { toExtractionUserMessage };
