import { IntegrationResolution } from "@knowledgeprism/constants";
import { z } from "zod";

const resolutionChoice = z.enum([
	IntegrationResolution.KEEP,
	IntegrationResolution.USE_NEW,
]);

const conflictResolution = z
	.object({
		changeId: z.number().int().positive(),
		content: resolutionChoice,
		title: resolutionChoice,
	})
	.required();

const integrationChangesApply = z
	.object({
		resolutions: z.array(conflictResolution),
	})
	.required();

export { integrationChangesApply };
