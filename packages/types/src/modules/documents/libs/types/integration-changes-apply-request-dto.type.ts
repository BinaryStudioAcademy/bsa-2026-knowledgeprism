import { type IntegrationChangeContentOverrideDto } from "./integration-change-content-override-dto.type.js";
import { type IntegrationConflictResolutionDto } from "./integration-conflict-resolution-dto.type.js";

type IntegrationChangesApplyRequestDto = {
	contentOverrides: IntegrationChangeContentOverrideDto[];
	resolutions: IntegrationConflictResolutionDto[];
};

export { type IntegrationChangesApplyRequestDto };
