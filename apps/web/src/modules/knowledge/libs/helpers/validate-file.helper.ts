import {
	DocumentValidationMessage,
	FileValidationRule,
	SUPPORTED_FILE_EXTENSIONS,
	SUPPORTED_FILE_MIME_TYPES,
} from "../constants/constants.js";

type FileValidationResult = {
	error: null | string;
	isValid: boolean;
};

const validateFile = (file: File): FileValidationResult => {
	const hasValidExtension = SUPPORTED_FILE_EXTENSIONS.some((extension) =>
		file.name.toLowerCase().endsWith(extension),
	);

	const hasValidMimeType =
		!file.type ||
		(SUPPORTED_FILE_MIME_TYPES as readonly string[]).includes(file.type);

	if (!hasValidExtension || !hasValidMimeType) {
		return {
			error: DocumentValidationMessage.UNSUPPORTED_FORMAT,
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
