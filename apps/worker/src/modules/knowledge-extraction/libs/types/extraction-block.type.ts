import { type PageStart } from "./page-start.type.js";

type ExtractionBlock = {
	content: string;
	pageEnd?: number;
	pageNumber: number;
	pageStarts?: PageStart[];
	part?: number;
	sectionIndex?: null | number;
	sectionTitle?: null | string;
};

export { type ExtractionBlock };
