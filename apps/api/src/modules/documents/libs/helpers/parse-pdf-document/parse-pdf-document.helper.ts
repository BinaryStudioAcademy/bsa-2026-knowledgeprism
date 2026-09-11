import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf.mjs";

const FIRST_PAGE_NUMBER = 1;
const PAGE_NUMBER_INCREMENT = 1;
const TEXT_ITEM_SEPARATOR = " ";

type PdfPageBlock = {
	content: string;
	pageNumber: number;
};

const parsePdfDocumentIntoBlocks = async (
	bytes: Uint8Array,
): Promise<PdfPageBlock[]> => {
	const loadingTask = pdfjsLib.getDocument({ data: bytes });
	const pdfDocument = await loadingTask.promise;
	const blocks: PdfPageBlock[] = [];

	for (
		let pageNumber = FIRST_PAGE_NUMBER;
		pageNumber <= pdfDocument.numPages;
		pageNumber += PAGE_NUMBER_INCREMENT
	) {
		const page = await pdfDocument.getPage(pageNumber);
		const textContent = await page.getTextContent();
		const content = textContent.items
			.map((item) => ("str" in item ? item.str : ""))
			.join(TEXT_ITEM_SEPARATOR)
			.trim();

		blocks.push({ content, pageNumber });
	}

	await loadingTask.destroy();

	return blocks;
};

export { type PdfPageBlock, parsePdfDocumentIntoBlocks };
