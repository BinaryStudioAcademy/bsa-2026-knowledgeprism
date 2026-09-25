import { IntegrationChangeType } from "@knowledgeprism/constants";

import { type ValueOf } from "~/lib/types/types.js";

import { type ChangeStatus } from "../types/types.js";

type IntegrationChangeTypeValue = ValueOf<typeof IntegrationChangeType>;

const mapIntegrationChangeTypeToChangeStatus = (
	type: IntegrationChangeTypeValue,
): ChangeStatus => {
	switch (type) {
		case IntegrationChangeType.CONFLICT: {
			return "conflict";
		}
		case IntegrationChangeType.DUPLICATE: {
			return "duplicate";
		}
		case IntegrationChangeType.NEW: {
			return "created";
		}
		case IntegrationChangeType.UPDATE: {
			return "modified";
		}
		default: {
			return "modified";
		}
	}
};

export { mapIntegrationChangeTypeToChangeStatus };
