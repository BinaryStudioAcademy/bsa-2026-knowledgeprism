import { type IntegrationChangeType } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class IntegrationChangeModel extends AbstractModel {
	public documentId!: number;

	public explanation!: string;

	public extractionItemId!: number;

	public incomingContent!: string;

	public incomingTitle!: string;

	public liveContent!: null | string;

	public liveTitle!: null | string;

	public matchedNodeId!: null | number;

	public score!: null | number;

	public type!: ValueOf<typeof IntegrationChangeType>;

	public static override get tableName(): string {
		return DatabaseTableName.INTEGRATION_CHANGES;
	}
}

export { IntegrationChangeModel };
