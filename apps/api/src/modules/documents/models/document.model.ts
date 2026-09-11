import { type DocumentStatus } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class DocumentModel extends AbstractModel {
	public mimeType!: string;

	public name!: string;

	public projectId!: string;

	public s3Key!: string;

	public sizeInBytes!: null | number;

	public status!: ValueOf<typeof DocumentStatus>;

	public uploadedBy!: null | number;

	public static override get tableName(): string {
		return DatabaseTableName.DOCUMENTS;
	}
}

export { DocumentModel };
