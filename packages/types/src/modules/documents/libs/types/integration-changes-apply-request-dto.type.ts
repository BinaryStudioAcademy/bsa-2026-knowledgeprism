import { type IntegrationConflictResolutionDto } from "./integration-conflict-resolution-dto.type.js";

type IntegrationChangesApplyRequestDto = {
	resolutions: IntegrationConflictResolutionDto[];
};

export { type IntegrationChangesApplyRequestDto };
