import { IntegrationChangeType } from "@knowledgeprism/constants";

type IntegrationChangeTypeValue =
	(typeof IntegrationChangeType)[keyof typeof IntegrationChangeType];

export { type IntegrationChangeTypeValue };
