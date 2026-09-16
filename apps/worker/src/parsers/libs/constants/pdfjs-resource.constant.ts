const PdfJsResourceDirectory = {
	CMAPS: "cmaps",
	ICCS: "iccs",
	STANDARD_FONTS: "standard_fonts",
	WASM: "wasm",
} as const;

const FIRST_PDF_PAGE_NUMBER = 1;
const LINE_BREAK = "\n";
const PDF_PAGE_NUMBER_STEP = 1;
const URL_PATH_SEPARATOR = "/";

export {
	FIRST_PDF_PAGE_NUMBER,
	LINE_BREAK,
	PDF_PAGE_NUMBER_STEP,
	PdfJsResourceDirectory,
	URL_PATH_SEPARATOR,
};
