import { ProjectValidationMessage } from "@knowledgeprism/constants";

import { projectCreate } from "./project-create.validation-schema.js";

const projectUpdate = projectCreate
	.partial()
	.refine(
		({ description, name }) => description !== undefined || name !== undefined,
		{
			error: ProjectValidationMessage.UPDATE_REQUIRE,
		},
	);

export { projectUpdate };
