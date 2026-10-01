import {
	BOM_CHARACTER,
	CARRIAGE_RETURN_CHARACTER,
	CARRIAGE_RETURN_NEWLINE_CHARACTER,
	UNICODE_NORMALIZATION_FORM,
} from "../constants/text-document.constant.js";

const normalizeTextContent = (text: string): string => {
	let normalized = text;

	if (normalized.startsWith(BOM_CHARACTER)) {
		normalized = normalized.slice(BOM_CHARACTER.length);
	}

	return normalized
		.replaceAll(CARRIAGE_RETURN_NEWLINE_CHARACTER, "\n")
		.replaceAll(CARRIAGE_RETURN_CHARACTER, "\n")
		.normalize(UNICODE_NORMALIZATION_FORM);
};

export { normalizeTextContent };
