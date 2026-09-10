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

const KnowledgeAddRole = [
	ProjectMemberRole.ADMIN,
	ProjectMemberRole.EDITOR,
] as const;

const KnowledgeViewRole = [
	ProjectMemberRole.ADMIN,
	ProjectMemberRole.EDITOR,
	ProjectMemberRole.VIEWER,
] as const;

type ProjectMemberRow = {
	role: string;
};

type ProjectRow = {
	id: number;
	organisationId: number;
};

class DocumentAccessService {
	private async assertHasRole({
		allowedRoles,
		projectId,
		userId,
	}: {
		allowedRoles: readonly string[];
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
			.where("projectId", project.id)
			.andWhere("userId", userId)
			.first();

		const hasAllowedRole =
			membership !== undefined && allowedRoles.includes(membership.role);

		if (!hasAllowedRole) {
			throw new HTTPError({
				message: DocumentErrorMessage.FORBIDDEN,
				status: HTTPCode.FORBIDDEN,
			});
		}
	}

	public async assertCanAddKnowledge({
		projectId,
		userId,
	}: {
		projectId: string;
		userId: number;
	}): Promise<void> {
		await this.assertHasRole({
			allowedRoles: KnowledgeAddRole,
			projectId,
			userId,
		});
	}

	public async assertCanViewKnowledge({
		projectId,
		userId,
	}: {
		projectId: string;
		userId: number;
	}): Promise<void> {
		await this.assertHasRole({
			allowedRoles: KnowledgeViewRole,
			projectId,
			userId,
		});
	}
}

export { DocumentAccessService };
