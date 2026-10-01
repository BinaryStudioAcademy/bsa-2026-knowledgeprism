import { type ExtractionContentBlock } from "./extraction-content-block.type.js";
import { type IntegrationChangeContentOverrideDto } from "./integration-change-content-override-dto.type.js";
import { type IntegrationConflictResolutionDto } from "./integration-conflict-resolution-dto.type.js";

type IntegrationChangesApplyRequestDto = {
	contentOverrides: IntegrationChangeContentOverrideDto[];
	items: IntegrationPublishedItemDto[];
	resolutions: IntegrationConflictResolutionDto[];
};

type IntegrationPublishedItemDto = {
	blocks?: ExtractionContentBlock[];
	id: number;
	text: string;
	title: string;
};

export { type IntegrationChangesApplyRequestDto };
