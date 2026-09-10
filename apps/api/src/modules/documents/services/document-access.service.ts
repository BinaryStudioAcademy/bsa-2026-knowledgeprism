import {
	DocumentErrorMessage,
	HTTPCode,
	ProjectMemberRole,
} from "@knowledgeprism/constants";
import { Model } from "objection";

import { HTTPError } from "~/infrastructure/http/http.js";

const TenancyTableName = {
	PROJECT_MEMBERS: "project_members",
	PROJECTS: "projects",
} as const;

type ProjectMemberRow = {
	role: string;
};

type ProjectRow = {
	id: number;
	organisationId: number;
};

class DocumentAccessService {
	public async assertCanAddKnowledge({
		projectId,
		userId,
	}: {
		projectId: string;
		userId: number;
	}): Promise<void> {
		const knex = Model.knex();
		const hasProjectsTable = await knex.schema.hasTable(
			TenancyTableName.PROJECTS,
		);
		const hasProjectMembersTable = await knex.schema.hasTable(
			TenancyTableName.PROJECT_MEMBERS,
		);

		if (!hasProjectsTable || !hasProjectMembersTable) {
			return;
		}

		const project = await knex<ProjectRow>(TenancyTableName.PROJECTS)
			.where("id", projectId)
			.first();

		if (!project) {
			throw new HTTPError({
				message: DocumentErrorMessage.PROJECT_NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		const membership = await knex<ProjectMemberRow>(
			TenancyTableName.PROJECT_MEMBERS,
		)
			.where("project_id", project.id)
			.andWhere("user_id", userId)
			.first();

		if (!membership || membership.role === ProjectMemberRole.VIEWER) {
			throw new HTTPError({
				message: DocumentErrorMessage.FORBIDDEN,
				status: HTTPCode.FORBIDDEN,
			});
		}

		const canAddKnowledge =
			membership.role === ProjectMemberRole.ADMIN ||
			membership.role === ProjectMemberRole.EDITOR;

		if (!canAddKnowledge) {
			throw new HTTPError({
				message: DocumentErrorMessage.FORBIDDEN,
				status: HTTPCode.FORBIDDEN,
			});
		}
	}
}

export { DocumentAccessService };
