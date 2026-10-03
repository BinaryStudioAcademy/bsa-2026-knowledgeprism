import { type ParsedTextLine } from "../types/parsed-text-line.type.js";

type PdfTextItem = {
	hasEOL: boolean;
	str: string;
	transform: number[];
};

const FONT_SIZE_TRANSFORM_INDEX = 3;
const NO_FONT_SIZE = 0;

const isPdfTextItem = (item: unknown): item is PdfTextItem => {
	return (
		typeof item === "object" &&
		item !== null &&
		"str" in item &&
		typeof item.str === "string" &&
		"hasEOL" in item &&
		typeof item.hasEOL === "boolean" &&
		"transform" in item &&
		Array.isArray(item.transform)
	);
};

const readFontSize = (item: PdfTextItem): number => {
	const size = item.transform[FONT_SIZE_TRANSFORM_INDEX];

	return typeof size === "number" ? Math.abs(size) : NO_FONT_SIZE;
};

const reconstructPdfPageLines = (
	items: readonly unknown[],
): ParsedTextLine[] => {
	const lines: ParsedTextLine[] = [];
	let text = "";
	let fontSize = NO_FONT_SIZE;

	const pushLine = (): void => {
		if (text.trim() !== "") {
			lines.push({
				fontSize: fontSize === NO_FONT_SIZE ? null : fontSize,
				text: text.trim(),
			});
		}

		text = "";
		fontSize = NO_FONT_SIZE;
	};

	for (const item of items) {
		if (!isPdfTextItem(item)) {
			continue;
		}

		text += item.str;

		if (item.str.trim() !== "") {
			fontSize = Math.max(fontSize, readFontSize(item));
		}

		if (item.hasEOL) {
			pushLine();
		}
	}

	pushLine();

	return lines;
};

export { reconstructPdfPageLines };
