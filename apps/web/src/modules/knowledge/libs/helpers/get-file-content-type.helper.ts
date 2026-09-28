import { findSupportedFileType } from "./find-supported-file-type.helper.js";

const getFileContentType = (file: File): string => {
	return findSupportedFileType(file.name)?.contentType ?? file.type;
};

export { getFileContentType };
