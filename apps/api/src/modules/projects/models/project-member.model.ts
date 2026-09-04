import { Model } from "objection";

import { DatabaseTableName } from "~/infrastructure/database/database.js";

class ProjectMemberModel extends Model {
	public createdAt!: Date | string;

	public id!: number;

	public projectId!: number;

	public role!: "EDITOR" | "VIEWER";

	public userId!: number;

	public static override get tableName(): string {
		return DatabaseTableName.PROJECT_MEMBERS;
	}

	public override $beforeInsert(): void {
		this.createdAt = new Date().toISOString();
	}
}

export { ProjectMemberModel };
