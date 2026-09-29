import { z } from "zod";

import { projectRouteParameters } from "../../../projects/libs/validation-schemas/project-route-parameters.validation-schema.js";

const glossaryRouteParameters = z
	.object({
		projectId: projectRouteParameters.shape.id,
	})
	.required();

export { glossaryRouteParameters };
