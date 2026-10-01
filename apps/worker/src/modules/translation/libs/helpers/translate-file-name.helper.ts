import { translateText } from "../../services/translation.service.js";

const STRING_START_INDEX = 0;

const translateFileName = async (fileName: string): Promise<string> => {
	const extensionIndex = fileName.lastIndexOf(".");

	if (extensionIndex <= STRING_START_INDEX) {
		return await translateText(fileName);
	}

	const name = fileName.slice(STRING_START_INDEX, extensionIndex);
	const extension = fileName.slice(extensionIndex);

	const translatedName = await translateText(name);

	return `${translatedName}${extension}`;
};

export { translateFileName };
