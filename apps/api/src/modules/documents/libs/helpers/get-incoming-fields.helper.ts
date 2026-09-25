import {
	IntegrationChangeType,
	IntegrationResolution,
} from "@knowledgeprism/constants";
import {
	type IntegrationConflictResolutionDto,
	type ValueOf,
} from "@knowledgeprism/types";

type IncomingFields = {
	content: boolean;
	title: boolean;
};

const getIncomingFields = (
	type: ValueOf<typeof IntegrationChangeType>,
	resolution: IntegrationConflictResolutionDto | undefined,
): IncomingFields => ({
	content:
		type === IntegrationChangeType.UPDATE ||
		resolution?.content === IntegrationResolution.USE_NEW,
	title: resolution?.title === IntegrationResolution.USE_NEW,
});

export { getIncomingFields };
