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
	id?: number;
	text: string;
	title: string;
};

export {
	type ExtractionItemsReviewRequestDto,
	type ExtractionItemsReviewSectionDto,
};
