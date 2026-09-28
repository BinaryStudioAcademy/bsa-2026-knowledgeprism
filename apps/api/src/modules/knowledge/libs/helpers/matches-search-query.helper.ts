import { flattenContentToText } from "@knowledgeprism/config";
import { type KnowledgeNodeContentDto } from "@knowledgeprism/types";

type SearchableNode = {
	contentJson: KnowledgeNodeContentDto;
	title: string;
};

const isMatchingSearchQuery = (
	node: SearchableNode,
	lowerCaseQuery: string,
): boolean => {
	if (node.title.toLowerCase().includes(lowerCaseQuery)) {
		return true;
	}

	return flattenContentToText(node.contentJson)
		.toLowerCase()
		.includes(lowerCaseQuery);
};

export { type SearchableNode, isMatchingSearchQuery };
