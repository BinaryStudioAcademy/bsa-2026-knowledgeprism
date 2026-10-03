import { type IntegrationChangeType } from "@knowledgeprism/constants";
import {
	type DocumentPlacementDto,
	type ExtractionContentBlock,
	type ValueOf,
} from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";
import { type NodeMergeMethod } from "~/modules/documents/libs/constants/node-merge-method.constant.js";

class IntegrationChangeModel extends AbstractModel {
	public documentId!: number;

	public duplicateOfExtractionItemId!: null | number;

	public explanation!: string;

	public extractionItemId!: number;

	public incomingContent!: string;

	public incomingTitle!: string;

	public liveContent!: null | string;

	public liveTitle!: null | string;

	public matchedNodeId!: null | number;

	public mergedBlocks!: ExtractionContentBlock[] | null;

	public mergeMethod!: null | ValueOf<typeof NodeMergeMethod>;

	public placement!: DocumentPlacementDto;

	public score!: null | number;

	public type!: ValueOf<typeof IntegrationChangeType>;

	public static override get jsonAttributes(): string[] {
		return ["mergedBlocks", "placement"];
	}

	public static override get tableName(): string {
		return DatabaseTableName.INTEGRATION_CHANGES;
	}
}

export { IntegrationChangeModel };
