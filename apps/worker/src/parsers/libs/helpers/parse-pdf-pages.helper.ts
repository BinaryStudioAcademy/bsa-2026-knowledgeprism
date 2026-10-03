import { createRequire } from "node:module";
import path from "node:path";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

import {
	FIRST_PDF_PAGE_NUMBER,
	PDF_PAGE_NUMBER_STEP,
	PdfJsResourceDirectory,
} from "../constants/pdfjs-resource.constant.js";
import { DocumentParseFailedError } from "../exceptions/document-parse-failed.exception.js";
import { type ParsedPageBlock } from "../types/parsed-page-block.type.js";
import { reconstructPdfPageLines } from "./reconstruct-pdf-page-lines.helper.js";
import { reconstructPdfPageText } from "./reconstruct-pdf-page-text.helper.js";

const require = createRequire(import.meta.url);

const PDFJS_PACKAGE_DIRECTORY = path.dirname(
	require.resolve("pdfjs-dist/package.json"),
);

// In Node, pdfjs reads these with fs.readFile(`${base}${filename}`), so they must be
// plain directory paths with a trailing separator — a file:// URL string fails with ENOENT.
const buildPdfJsResourceUrl = (resourceDirectoryName: string): string => {
	return `${path.join(PDFJS_PACKAGE_DIRECTORY, resourceDirectoryName)}${path.sep}`;
};

const CMAP_URL = buildPdfJsResourceUrl(PdfJsResourceDirectory.CMAPS);
const ICC_URL = buildPdfJsResourceUrl(PdfJsResourceDirectory.ICCS);
const STANDARD_FONT_DATA_URL = buildPdfJsResourceUrl(
	PdfJsResourceDirectory.STANDARD_FONTS,
);
const WASM_URL = buildPdfJsResourceUrl(PdfJsResourceDirectory.WASM);

const parsePdfPages = async (bytes: Uint8Array): Promise<ParsedPageBlock[]> => {
	const loadingTask = getDocument({
		cMapUrl: CMAP_URL,
		data: bytes,
		iccUrl: ICC_URL,
		standardFontDataUrl: STANDARD_FONT_DATA_URL,
		stopAtErrors: true,
		wasmUrl: WASM_URL,
	});

	try {
		const pdf = await loadingTask.promise;
		const pages: ParsedPageBlock[] = [];

		for (
			let pageNumber = FIRST_PDF_PAGE_NUMBER;
			pageNumber <= pdf.numPages;
			pageNumber += PDF_PAGE_NUMBER_STEP
		) {
			const page = await pdf.getPage(pageNumber);
			const textContent = await page.getTextContent();

			pages.push({
				content: reconstructPdfPageText(textContent.items),
				lines: reconstructPdfPageLines(textContent.items),
				pageNumber,
			});
		}

		return pages;
	} catch (error) {
		throw new DocumentParseFailedError({
			cause: error,
			message: "Failed to parse PDF document.",
		});
	} finally {
		await loadingTask.destroy();
	}
};

export { parsePdfPages };
