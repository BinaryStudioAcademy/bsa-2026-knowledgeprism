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
	USERS: "users",
} as const;

type ProjectMemberRow = {
	role: string;
};

type ProjectRow = {
	id: number;
	organisationId: number;
};

type UserRow = {
	organisationId?: null | number;
	role?: null | string;
};

class DocumentAccessService {
	private async isOrganisationAdmin({
		organisationId,
		userId,
	}: {
		organisationId: number;
		userId: number;
	}): Promise<boolean> {
		const knex = Model.knex();
		const user = await knex<UserRow>(TenancyTableName.USERS)
			.where("id", userId)
			.first();

		if (!user || user.organisationId !== organisationId) {
			return false;
		}

		return user.role === ProjectMemberRole.ADMIN;
	}

	public async assertCanAddKnowledge({
		projectId,
		userId,
	}: {
		projectId: number;
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

		const isOrganisationAdmin = await this.isOrganisationAdmin({
			organisationId: project.organisationId,
			userId,
		});

		if (isOrganisationAdmin) {
			return;
		}

		const membership = await knex<ProjectMemberRow>(
			TenancyTableName.PROJECT_MEMBERS,
		)
			.where("project_id", projectId)
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
