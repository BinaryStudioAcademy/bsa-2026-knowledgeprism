import { type ValueOf } from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";
import { type ProjectStorageCleanupStatus } from "~/modules/projects/libs/enums/enums.js";

class ProjectStorageCleanupModel extends AbstractModel {
	public attempts!: number;

	public errorMessage!: null | string;

	public executeAfter!: Date;

	public prefix!: string;

	public projectId!: number;

	public status!: ValueOf<typeof ProjectStorageCleanupStatus>;

	public static override get tableName(): string {
		return DatabaseTableName.PROJECT_STORAGE_CLEANUPS;
	}
}

export { ProjectStorageCleanupModel };
