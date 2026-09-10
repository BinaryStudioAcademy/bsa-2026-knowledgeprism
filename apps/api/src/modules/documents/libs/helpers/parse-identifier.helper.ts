import {
	DocumentErrorMessage,
	DocumentValidationMessage,
	DocumentValidationRule,
	HTTPCode,
} from "@knowledgeprism/constants";

import { HTTPError } from "~/infrastructure/http/http.js";

const parseIdentifier = (value: string): number => {
	const parsedValue = Number(value);
	const isValidIdentifier =
		Number.isSafeInteger(parsedValue) &&
		parsedValue >= DocumentValidationRule.IDENTIFIER_MINIMUM_VALUE &&
		String(parsedValue) === value;

	if (!isValidIdentifier) {
		throw new HTTPError({
			message: DocumentValidationMessage.IDENTIFIER_INVALID,
			status: HTTPCode.BAD_REQUEST,
		});
	}

	return parsedValue;
};

const getRequiredUserId = (userId: number | undefined): number => {
	if (typeof userId !== "number") {
		throw new HTTPError({
			message: DocumentErrorMessage.UNAUTHORIZED,
			status: HTTPCode.UNAUTHORIZED,
		});
	}

	return userId;
};

export { getRequiredUserId, parseIdentifier };
