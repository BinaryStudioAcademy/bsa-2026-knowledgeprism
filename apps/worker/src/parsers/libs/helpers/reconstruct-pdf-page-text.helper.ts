import { LINE_BREAK } from "../constants/pdfjs-resource.constant.js";

type PdfTextItem = {
	hasEOL: boolean;
	str: string;
};

const isPdfTextItem = (item: unknown): item is PdfTextItem => {
	return (
		typeof item === "object" &&
		item !== null &&
		"str" in item &&
		typeof item.str === "string" &&
		"hasEOL" in item &&
		typeof item.hasEOL === "boolean"
	);
};

const reconstructPdfPageText = (items: readonly unknown[]): string => {
	const parts: string[] = [];

	for (const item of items) {
		if (!isPdfTextItem(item)) {
			continue;
		}

		parts.push(item.str);

		if (item.hasEOL) {
			parts.push(LINE_BREAK);
		}
	}

	return parts.join("");
};

export { reconstructPdfPageText };
