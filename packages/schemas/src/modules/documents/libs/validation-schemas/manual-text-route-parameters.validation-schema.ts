import { DocumentValidationMessage } from "@knowledgeprism/constants";
import { z } from "zod";

import { documentUploadIntentRouteParameters } from "./document-upload-intent-route-parameters.validation-schema.js";

const POSITIVE_INTEGER_STRING_PATTERN = /^[1-9]\d*$/;

const manualTextRouteParameters = documentUploadIntentRouteParameters.extend({
	id: z.string().regex(POSITIVE_INTEGER_STRING_PATTERN, {
		message: DocumentValidationMessage.IDENTIFIER_INVALID,
	}),
});

export { manualTextRouteParameters };
