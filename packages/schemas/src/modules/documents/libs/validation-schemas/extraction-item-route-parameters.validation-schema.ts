import { documentRouteParameters } from "./document-route-parameters.validation-schema.js";
import { manualTextRouteParameters } from "./manual-text-route-parameters.validation-schema.js";

const extractionItemRouteParameters = documentRouteParameters.extend({
	id: manualTextRouteParameters.shape.id,
});

export { extractionItemRouteParameters };
