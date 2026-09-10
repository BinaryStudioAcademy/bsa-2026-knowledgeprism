import { type AskPrismSourceDto } from "./ask-prism-source-dto.type.js";

type AskPrismResponseDto = {
	answer: string;
	sources: AskPrismSourceDto[];
};

export { type AskPrismResponseDto };
