import { IntegrationChangeType } from "../constants/integration-change-type.constant.js";

type IntegrationChangeTypeValue =
	(typeof IntegrationChangeType)[keyof typeof IntegrationChangeType];

export { type IntegrationChangeTypeValue };
