import {
	DocumentErrorMessage,
	DocumentValidationRule,
	HTTPCode,
	ProjectMemberRole,
} from "@knowledgeprism/constants";

import { HTTPError } from "~/infrastructure/http/http.js";
import { ProjectMemberModel } from "~/modules/projects/models/project-member.model.js";
import { ProjectModel } from "~/modules/projects/models/project.model.js";

const KnowledgeAddRole = [
	ProjectMemberRole.ADMIN,
	ProjectMemberRole.EDITOR,
] as const;

const KnowledgeViewRole = [
	ProjectMemberRole.ADMIN,
	ProjectMemberRole.EDITOR,
	ProjectMemberRole.VIEWER,
] as const;

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
		const parsedProjectId = Number(projectId);

		if (
			!Number.isSafeInteger(parsedProjectId) ||
			parsedProjectId < DocumentValidationRule.IDENTIFIER_MINIMUM_VALUE ||
			String(parsedProjectId) !== projectId
		) {
			throw new HTTPError({
				message: DocumentErrorMessage.PROJECT_NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		const project = await ProjectModel.query().findById(parsedProjectId);

		if (!project) {
			throw new HTTPError({
				message: DocumentErrorMessage.PROJECT_NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		const membership = await ProjectMemberModel.query().findOne({
			projectId: project.id,
			userId,
		});

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
