import { Model, type RelationMappings } from "objection";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";
import { OrganisationModel } from "~/modules/organisations/models/organisation.model.js";
import { ProjectMemberModel } from "~/modules/projects/models/project-member.model.js";
import { ProjectModel } from "~/modules/projects/models/project.model.js";

class UserModel extends AbstractModel {
	public email!: string;

	public firstName!: null | string;

	public lastName!: null | string;

	public organisation?: OrganisationModel;

	public organisationId!: null | number;

	public passwordHash!: string;

	public projectMembers?: ProjectMemberModel[];

	public projects?: ProjectModel[];

	public status!: "active" | "inactive";

	public static override get relationMappings(): RelationMappings {
		return {
			organisation: {
				join: {
					from: `${DatabaseTableName.USERS}.organisationId`,
					to: `${DatabaseTableName.ORGANISATIONS}.id`,
				},
				modelClass: OrganisationModel,
				relation: Model.BelongsToOneRelation,
			},
			projectMembers: {
				join: {
					from: `${DatabaseTableName.USERS}.id`,
					to: `${DatabaseTableName.PROJECT_MEMBERS}.userId`,
				},
				modelClass: ProjectMemberModel,
				relation: Model.HasManyRelation,
			},
			projects: {
				join: {
					from: `${DatabaseTableName.USERS}.id`,
					through: {
						from: `${DatabaseTableName.PROJECT_MEMBERS}.userId`,
						to: `${DatabaseTableName.PROJECT_MEMBERS}.projectId`,
					},
					to: `${DatabaseTableName.PROJECTS}.id`,
				},
				modelClass: ProjectModel,
				relation: Model.ManyToManyRelation,
			},
		};
	}

	public static override get tableName(): string {
		return DatabaseTableName.USERS;
	}
}

export { UserModel };
