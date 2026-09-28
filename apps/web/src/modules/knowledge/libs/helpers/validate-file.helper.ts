import {
	DocumentValidationMessage,
	FileValidationRule,
} from "../constants/constants.js";
import { findSupportedFileType } from "./find-supported-file-type.helper.js";

type FileValidationResult = {
	error: null | string;
	isValid: boolean;
};

const EMPTY_FILE_SIZE = 0;

const validateFile = (file: File): FileValidationResult => {
	const supportedFileType = findSupportedFileType(file.name);
	const hasMatchingMimeType =
		!file.type || file.type === supportedFileType?.contentType;

	if (!supportedFileType || !hasMatchingMimeType) {
		return {
			error: DocumentValidationMessage.UNSUPPORTED_FORMAT,
			isValid: false,
		};
	}

	if (file.size === EMPTY_FILE_SIZE) {
		return {
			error: DocumentValidationMessage.EMPTY_FILE,
			isValid: false,
		};
	}

	if (file.size > FileValidationRule.MAXIMUM_FILE_SIZE_IN_BYTES) {
		return {
			error: DocumentValidationMessage.FILE_TOO_LARGE,
			isValid: false,
		};
	}

	return {
		error: null,
		isValid: true,
	};
};

export { validateFile };
