import { documentUploadIntentRouteParameters } from "./document-upload-intent-route-parameters.validation-schema.js";
import { manualTextRouteParameters } from "./manual-text-route-parameters.validation-schema.js";

const documentRouteParameters = documentUploadIntentRouteParameters.extend({
	documentId: manualTextRouteParameters.shape.id,
});

export { documentRouteParameters };
