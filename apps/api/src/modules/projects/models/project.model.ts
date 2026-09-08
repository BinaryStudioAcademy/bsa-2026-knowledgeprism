import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class ProjectModel extends AbstractModel {
	public description!: null | string;

	public name!: string;

	public organisationId!: number;

	public static override get tableName(): string {
		return DatabaseTableName.PROJECTS;
	}
}

export { ProjectModel };
