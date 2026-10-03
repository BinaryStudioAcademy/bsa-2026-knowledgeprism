import { TREE_TAG } from "../constants/classification-prompt.constant.js";
import { SECTIONS_TAG } from "../constants/outline-prompt.constant.js";
import { type PlacementTreeNode } from "../types/integration-analysis-parameters.type.js";
import { type OutlineSection } from "../types/section-outline.type.js";
import { toTreeLines } from "./to-classification-prompt.helper.js";

const OPENING_LENGTH = 200;
const OPENING_START = 0;
const WHITESPACE = /\s+/gu;

type OutlineRequest = {
	sections: OutlineSection[];
	tree: PlacementTreeNode[];
};

const toSectionLines = (sections: OutlineSection[]): string => {
	return sections
		.map(({ text, title }, index) => {
			const opening = text
				.replaceAll(WHITESPACE, " ")
				.trim()
				.slice(OPENING_START, OPENING_LENGTH);

			return `${index.toString()} | ${title} | ${opening}`;
		})
		.join("\n");
};

const toOutlinePrompt = ({ sections, tree }: OutlineRequest): string => {
	return [
		`<${TREE_TAG}>`,
		toTreeLines(tree),
		`</${TREE_TAG}>`,
		`<${SECTIONS_TAG}>`,
		toSectionLines(sections),
		`</${SECTIONS_TAG}>`,
	].join("\n");
};

export { toOutlinePrompt };
export type { OutlineRequest };
