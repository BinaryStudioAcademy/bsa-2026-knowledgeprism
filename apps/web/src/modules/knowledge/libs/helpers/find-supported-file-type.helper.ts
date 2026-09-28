import { SUPPORTED_FILE_TYPES } from "../constants/constants.js";

type SupportedFileType = (typeof SUPPORTED_FILE_TYPES)[number];

const findSupportedFileType = (
	fileName: string,
): SupportedFileType | undefined => {
	const normalizedFileName = fileName.toLowerCase();

	return SUPPORTED_FILE_TYPES.find(({ extension }) => {
		return normalizedFileName.endsWith(extension);
	});
};

export { findSupportedFileType };
