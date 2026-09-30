import { type ExtractionItemResponseDto } from "./extraction-item-response-dto.type.js";

type ExtractionItemsResponseDto = {
	failedPageNumbers: number[];
	items: ExtractionItemResponseDto[];
	sections: ExtractionSectionResponseDto[];
};

type ExtractionSectionResponseDto = {
	id: number;
	position: number;
	title: string;
};

export { type ExtractionItemsResponseDto, type ExtractionSectionResponseDto };
