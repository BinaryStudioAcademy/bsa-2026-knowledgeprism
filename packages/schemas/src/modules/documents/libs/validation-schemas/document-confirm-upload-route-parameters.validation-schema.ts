import { z } from "zod";

import { projectRouteParameters } from "../../../projects/libs/validation-schemas/project-route-parameters.validation-schema.js";

const documentConfirmUploadRouteParameters = z
	.object({
		documentId: z.coerce.number().int().positive(),
		projectId: projectRouteParameters.shape.id,
	})
	.required();

export { documentConfirmUploadRouteParameters };
