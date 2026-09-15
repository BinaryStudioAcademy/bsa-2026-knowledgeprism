const PdfJsResourceDirectory = {
	CMAPS: "cmaps",
	ICCS: "iccs",
	STANDARD_FONTS: "standard_fonts",
	WASM: "wasm",
} as const;

const FIRST_PDF_PAGE_NUMBER = 1;
const LINE_BREAK = "\n";
const URL_PATH_SEPARATOR = "/";

export {
	FIRST_PDF_PAGE_NUMBER,
	LINE_BREAK,
	PdfJsResourceDirectory,
	URL_PATH_SEPARATOR,
};
