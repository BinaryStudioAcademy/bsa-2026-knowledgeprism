import { type ExtractionItemResponseDto } from "./extraction-item-response-dto.type.js";

type ExtractionItemsResponseDto = {
	failedPageNumbers: number[];
	items: ExtractionItemResponseDto[];
};

export { type ExtractionItemsResponseDto };
