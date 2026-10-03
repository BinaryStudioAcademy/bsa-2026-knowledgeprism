import {
	SourceMapping,
	SourceRange,
} from "~/modules/translation/libs/types/source-mapping.type.js";

import { type PageStart } from "./page-start.type.js";

type ExtractionBlock = {
	content: string;
	originalContent?: string;
	originalPageStarts?: PageStart[];
	pageEnd?: number;
	pageNumber: number;
	pageStarts?: PageStart[];
	part?: number;
	sectionIndex?: null | number;
	sectionTitle?: null | string;
	sourceMappings?: SourceMapping[];
	sourceRange?: SourceRange;
};

export { type ExtractionBlock };
