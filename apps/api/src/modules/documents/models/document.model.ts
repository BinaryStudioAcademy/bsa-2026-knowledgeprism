import { DocumentSourceType, DocumentStatus } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class DocumentModel extends AbstractModel {
	public content!: string;

	public contentHash!: string;

	public createdByUserId!: number;

	public errorMessage!: null | string;

	public projectId!: number;

	public sourceType!: ValueOf<typeof DocumentSourceType>;

	public status!: ValueOf<typeof DocumentStatus>;

	public title!: null | string;

	public static override get tableName(): string {
		return DatabaseTableName.DOCUMENTS;
	}
}

export { DocumentModel };
