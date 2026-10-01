import { type ExtractionContentBlock } from "./extraction-content-block.type.js";

type ExtractionItemsReviewRequestDto = {
	approvedIds: number[];
	rejectedIds: number[];
	sections?: ExtractionItemsReviewSectionDto[];
};

type ExtractionItemsReviewSectionDto = {
	items: ExtractionItemsReviewSectionItemDto[];
	title: string;
};

type ExtractionItemsReviewSectionItemDto = {
	blocks?: ExtractionContentBlock[];
	id?: number;
	text: string;
	title: string;
};

export {
	type ExtractionItemsReviewRequestDto,
	type ExtractionItemsReviewSectionDto,
};
