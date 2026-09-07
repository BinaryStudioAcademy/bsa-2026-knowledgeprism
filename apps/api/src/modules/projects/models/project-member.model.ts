import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class ProjectMemberModel extends AbstractModel {
	public projectId!: number;

	public role!: "ADMIN" | "EDITOR" | "VIEWER";

	public userId!: number;

	public static override get tableName(): string {
		return DatabaseTableName.PROJECT_MEMBERS;
	}
}

export { ProjectMemberModel };
