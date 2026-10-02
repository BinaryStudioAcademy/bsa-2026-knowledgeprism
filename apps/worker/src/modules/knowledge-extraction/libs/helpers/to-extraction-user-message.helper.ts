import {
	PAGE_CONTENT_TAG,
	PREVIOUS_ATTEMPT_ERROR_TAG,
	PREVIOUS_HEADING_TAG,
} from "../constants/extraction-prompt.constant.js";

const LINE_BREAK = "\n";

const toTag = (tag: string, value: null | string): null | string => {
	return value === null || value.trim() === ""
		? null
		: `<${tag}>${value}</${tag}>`;
};

const toExtractionUserMessage = (
	content: string,
	previousHeading: null | string,
	feedback: null | string = null,
): string => {
	return [
		toTag(PREVIOUS_HEADING_TAG, previousHeading),
		`<${PAGE_CONTENT_TAG}>\n${content}\n</${PAGE_CONTENT_TAG}>`,
		toTag(PREVIOUS_ATTEMPT_ERROR_TAG, feedback),
	]
		.filter((part): part is string => part !== null)
		.join(LINE_BREAK);
};

export { toExtractionUserMessage };
