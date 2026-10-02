import { type PageStart } from "~/modules/knowledge-extraction/libs/types/page-start.type.js";

type DocumentChunk = {
	content: string;
	pageEnd: number;
	pageNumber: number;
	pageStarts: PageStart[];
	part: number;
	position: number;
	sectionIndex: null | number;
	sectionTitle: null | string;
};

export { type DocumentChunk };
