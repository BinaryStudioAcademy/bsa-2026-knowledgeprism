import { invokeFileNameTranslation } from "./invoke-file-name-translation.helper.js";

const STRING_START_INDEX = 0;
const INDEX_STEP = 1;
const MAX_FILE_NAME_LENGTH = 200;
const QUOTE_CHARACTERS = "\"'`";

const stripQuotes = (value: string): string => {
	let start = STRING_START_INDEX;
	let end = value.length;

	while (start < end && QUOTE_CHARACTERS.includes(value.charAt(start))) {
		start += INDEX_STEP;
	}

	while (
		end > start &&
		QUOTE_CHARACTERS.includes(value.charAt(end - INDEX_STEP))
	) {
		end -= INDEX_STEP;
	}

	return value.slice(start, end);
};

const sanitizeFileName = (value: string): string => {
	const cleaned = value
		.replaceAll(/<\/?file-name>/g, "")
		.replaceAll(/[\r\n]+/g, " ")
		.replaceAll(/[/\\]/g, "-")
		.trim();

	return stripQuotes(cleaned)
		.trim()
		.slice(STRING_START_INDEX, MAX_FILE_NAME_LENGTH);
};

const translatePart = async (name: string): Promise<string> => {
	try {
		const translated = sanitizeFileName(await invokeFileNameTranslation(name));

		return translated || name;
	} catch {
		return name;
	}
};

const translateFileName = async (fileName: string): Promise<string> => {
	const extensionIndex = fileName.lastIndexOf(".");

	if (extensionIndex <= STRING_START_INDEX) {
		return await translatePart(fileName);
	}

	const name = fileName.slice(STRING_START_INDEX, extensionIndex);
	const extension = fileName.slice(extensionIndex);

	return `${await translatePart(name)}${extension}`;
};

export { translateFileName };
