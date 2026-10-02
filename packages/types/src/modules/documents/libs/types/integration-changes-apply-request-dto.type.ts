import { type ExtractionContentBlock } from "./extraction-content-block.type.js";
import { type IntegrationChangeContentOverrideDto } from "./integration-change-content-override-dto.type.js";
import { type IntegrationConflictResolutionDto } from "./integration-conflict-resolution-dto.type.js";

type IntegrationChangesApplyRequestDto = {
	contentOverrides: IntegrationChangeContentOverrideDto[];
	items: IntegrationPublishedItemDto[];
	placements?: IntegrationPlacementDto[];
	resolutions: IntegrationConflictResolutionDto[];
};

type IntegrationPlacementDto = {
	changeId: number;
	/** Parent extraction item retained in this request; exclusive with parentId. */
	parentExtractionItemId?: null | number;
	parentId: null | number;
	position: number;
};

type IntegrationPublishedItemDto = {
	blocks?: ExtractionContentBlock[];
	id: number;
	text: string;
	title: string;
};

export { type IntegrationChangesApplyRequestDto };
