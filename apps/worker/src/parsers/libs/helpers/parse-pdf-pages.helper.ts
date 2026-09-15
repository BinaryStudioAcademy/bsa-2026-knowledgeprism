import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";

import {
	FIRST_PDF_PAGE_NUMBER,
	PdfJsResourceDirectory,
	URL_PATH_SEPARATOR,
} from "../constants/pdfjs-resource.constant.js";
import { DocumentParseFailedError } from "../exceptions/document-parse-failed.exception.js";
import { type ParsedPageBlock } from "../types/parsed-page-block.type.js";
import { reconstructPdfPageText } from "./reconstruct-pdf-page-text.helper.js";

const require = createRequire(import.meta.url);

const PDFJS_PACKAGE_DIRECTORY = path.dirname(
	require.resolve("pdfjs-dist/package.json"),
);

const buildPdfJsResourceUrl = (resourceDirectoryName: string): string => {
	return `${pathToFileURL(path.join(PDFJS_PACKAGE_DIRECTORY, resourceDirectoryName)).href}${URL_PATH_SEPARATOR}`;
};

GlobalWorkerOptions.workerSrc = pathToFileURL(
	require.resolve("pdfjs-dist/build/pdf.worker.mjs"),
).href;

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
			pageNumber += 1
		) {
			const page = await pdf.getPage(pageNumber);
			const textContent = await page.getTextContent();

			pages.push({
				content: reconstructPdfPageText(textContent.items),
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
