import { ProjectMemberRole } from "@knowledgeprism/constants";
import { type ProjectMemberResponseDto } from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { DatabaseTableName } from "~/infrastructure/database/database.js";
import { type ProjectMemberModel } from "~/modules/projects/models/project-member.model.js";

class ProjectMemberRepository {
	private projectMemberModel: typeof ProjectMemberModel;

	public constructor(projectMemberModel: typeof ProjectMemberModel) {
		this.projectMemberModel = projectMemberModel;
	}

	public async create(
		payload: {
			projectId: number;
			role: typeof ProjectMemberRole.EDITOR | typeof ProjectMemberRole.VIEWER;
			userId: number;
		},
		transaction?: Transaction,
	): Promise<ProjectMemberModel> {
		return await this.projectMemberModel
			.query(transaction)
			.insert(payload)
			.returning("*")
			.execute();
	}

	public async exists(
		projectId: number,
		userId: number,
		transaction?: Transaction,
	): Promise<boolean> {
		const member = await this.projectMemberModel
			.query(transaction)
			.findOne({
				projectId,
				userId,
			})
			.select("id")
			.execute();

		return Boolean(member);
	}

	public async findAllByProjectIdAndOrganisationId(
		projectId: number,
		organisationId: number,
		transaction?: Transaction,
	): Promise<ProjectMemberResponseDto[]> {
		return await this.projectMemberModel
			.query(transaction)
			.alias("pm")
			.innerJoin(`${DatabaseTableName.USERS} as u`, "u.id", "pm.userId")
			.innerJoin(`${DatabaseTableName.PROJECTS} as p`, "p.id", "pm.projectId")
			.select([
				"u.email",
				"u.firstName",
				"u.lastName",
				"pm.role",
				"u.status",
				"u.id as userId",
			])
			.where("p.id", projectId)
			.where("p.organisationId", organisationId)
			.whereIn("pm.role", [ProjectMemberRole.EDITOR, ProjectMemberRole.VIEWER])
			.orderBy("u.id", "asc")
			.castTo<ProjectMemberResponseDto[]>()
			.execute();
	}
}

export { ProjectMemberRepository };
