import { z } from "zod";

import { projectRouteParameters } from "../../../projects/libs/validation-schemas/project-route-parameters.validation-schema.js";

const documentUploadIntentRouteParameters = z
	.object({
		projectId: projectRouteParameters.shape.id,
	})
	.required();

export { documentUploadIntentRouteParameters };
