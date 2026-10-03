import { type ParsedTextLine } from "./parsed-text-line.type.js";

type ParsedPageBlock = {
	content: string;
	lines?: ParsedTextLine[];
	pageNumber: number;
};

export { type ParsedPageBlock };
