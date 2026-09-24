import {
	HTTPCode,
	ProjectMemberRole,
	ProjectValidationMessage,
	UserStatus,
	UserValidationMessage,
} from "@knowledgeprism/constants";
import {
	type ProjectCreateRequestDto,
	type ProjectGetAllItemResponseDto,
	type ProjectGetAllResponseDto,
	type ProjectMemberCreateRequestDto,
	type ProjectMemberResponseDto,
	type ProjectMembersResponseDto,
	type ProjectResponseDto,
	type ProjectUpdateRequestDto,
} from "@knowledgeprism/types";
import { UniqueViolationError } from "objection";

import { DatabaseConstraintName } from "~/infrastructure/database/libs/enums/database-constraint-name.enum.js";
import { HTTPError } from "~/infrastructure/http/http.js";
import { ProjectEntity } from "~/modules/projects/models/project.entity.js";
import { type ProjectMemberRepository } from "~/modules/projects/repositories/project-member.repository.js";
import { type ProjectRepository } from "~/modules/projects/repositories/project.repository.js";
import { type UserEntity } from "~/modules/users/models/user.entity.js";
import { type UserService } from "~/modules/users/services/user.service.js";

type Constructor = {
	projectMemberRepository: ProjectMemberRepository;
	projectRepository: ProjectRepository;
	userService: UserService;
};

type ProjectAccessContext = {
	organisationId: number;
	userId: number;
};

type ProjectWorkspaceDatabaseRow = {
	description: null | string;
	id: number;
	latestKnowledgeUpdatedAt: Date | null;
	name: string;
	updatedAt: Date;
};

class ProjectService {
	private projectMemberRepository: ProjectMemberRepository;

	private projectRepository: ProjectRepository;

	private userService: UserService;

	public constructor({
		projectMemberRepository,
		projectRepository,
		userService,
	}: Constructor) {
		this.projectMemberRepository = projectMemberRepository;
		this.projectRepository = projectRepository;
		this.userService = userService;
	}

	private async assertOrganisationAdmin(
		context: ProjectAccessContext,
	): Promise<void> {
		const user = await this.findActor(context);

		if (!user.isOrganisationAdmin()) {
			this.throwAccessForbidden();
		}
	}

	private async findActor(context: ProjectAccessContext): Promise<UserEntity> {
		const user = await this.userService.findById(context.userId);

		if (!user) {
			this.throwAccessForbidden();
		}

		const userObject = user.toObject();

		if (
			userObject.organisationId !== context.organisationId ||
			userObject.status !== UserStatus.ACTIVE
		) {
			this.throwAccessForbidden();
		}

		return user;
	}

	private async findProjectOrThrow(
		id: number,
		organisationId: number,
	): Promise<ProjectEntity> {
		const project = await this.projectRepository.findByIdAndOrganisationId(
			id,
			organisationId,
		);

		if (!project) {
			throw new HTTPError({
				message: ProjectValidationMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		return project;
	}

	private mapProjectToResponse(project: ProjectEntity): ProjectResponseDto {
		const { createdAt, description, id, name, updatedAt } = project.toObject();

		return {
			createdAt: createdAt.toISOString(),
			description,
			id,
			name,
			updatedAt: updatedAt.toISOString(),
		};
	}

	private mapWorkspaceProject(
		project: ProjectWorkspaceDatabaseRow,
		role: ProjectGetAllItemResponseDto["role"],
	): ProjectGetAllItemResponseDto {
		const lastActivityAt =
			project.latestKnowledgeUpdatedAt &&
			project.latestKnowledgeUpdatedAt > project.updatedAt
				? project.latestKnowledgeUpdatedAt
				: project.updatedAt;

		return {
			description: project.description,
			id: project.id,
			lastActivityAt: lastActivityAt.toISOString(),
			name: project.name,
			role,
		};
	}

	private sortWorkspaceProjects(
		projects: ProjectGetAllItemResponseDto[],
	): ProjectGetAllItemResponseDto[] {
		return projects.toSorted((firstProject, secondProject) => {
			return (
				Date.parse(secondProject.lastActivityAt) -
				Date.parse(firstProject.lastActivityAt)
			);
		});
	}

	private throwAccessForbidden(): never {
		throw new HTTPError({
			message: ProjectValidationMessage.ACCESS_FORBIDDEN,
			status: HTTPCode.FORBIDDEN,
		});
	}

	public async addMember(
		projectId: number,
		payload: ProjectMemberCreateRequestDto,
		context: ProjectAccessContext,
	): Promise<ProjectMemberResponseDto> {
		await this.assertOrganisationAdmin(context);
		await this.findProjectOrThrow(projectId, context.organisationId);

		const user = await this.userService.findById(payload.userId);

		if (!user || user.toObject().organisationId !== context.organisationId) {
			throw new HTTPError({
				message: UserValidationMessage.USER_NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		const hasMember = await this.projectMemberRepository.exists(
			projectId,
			payload.userId,
		);

		if (hasMember) {
			throw new HTTPError({
				message: ProjectValidationMessage.MEMBER_ALREADY_EXISTS,
				status: HTTPCode.CONFLICT,
			});
		}

		try {
			await this.projectMemberRepository.create({
				projectId,
				role: payload.role,
				userId: payload.userId,
			});
		} catch (error) {
			if (
				error instanceof UniqueViolationError &&
				error.constraint ===
					DatabaseConstraintName.PROJECT_MEMBERS_PROJECT_ID_USER_ID_UNIQUE
			) {
				throw new HTTPError({
					cause: error,
					message: ProjectValidationMessage.MEMBER_ALREADY_EXISTS,
					status: HTTPCode.CONFLICT,
				});
			}

			throw error;
		}

		const { email, firstName, id, lastName, status } = user.toObject();

		return {
			email,
			firstName,
			lastName,
			role: payload.role,
			status,
			userId: id,
		};
	}

	public async assertCanWriteKnowledge(
		projectId: number,
		context: ProjectAccessContext,
	): Promise<void> {
		const user = await this.findActor(context);

		await this.findProjectOrThrow(projectId, context.organisationId);

		if (user.isOrganisationAdmin()) {
			return;
		}

		const role = await this.projectMemberRepository.findRole(
			projectId,
			context.userId,
		);

		if (role !== ProjectMemberRole.ADMIN && role !== ProjectMemberRole.EDITOR) {
			this.throwAccessForbidden();
		}
	}

	public async assertProjectAccess(
		projectId: number,
		context: ProjectAccessContext,
	): Promise<void> {
		const user = await this.findActor(context);

		await this.findProjectOrThrow(projectId, context.organisationId);

		if (user.isOrganisationAdmin()) {
			return;
		}

		const role = await this.projectMemberRepository.findRole(
			projectId,
			context.userId,
		);

		if (!role) {
			this.throwAccessForbidden();
		}
	}

	public async assertProjectEditAccess(
		projectId: number,
		context: ProjectAccessContext,
	): Promise<void> {
		await this.assertCanWriteKnowledge(projectId, context);
	}

	public async create(
		payload: ProjectCreateRequestDto,
		context: ProjectAccessContext,
	): Promise<ProjectResponseDto> {
		await this.assertOrganisationAdmin(context);

		const project = await this.projectRepository.create(
			ProjectEntity.initializeNew({
				description: payload.description?.trim() ?? null,
				name: payload.name.trim(),
				organisationId: context.organisationId,
			}),
		);

		return this.mapProjectToResponse(project);
	}

	public async delete(
		id: number,
		context: ProjectAccessContext,
	): Promise<void> {
		await this.assertOrganisationAdmin(context);
		await this.findProjectOrThrow(id, context.organisationId);

		const wasDeleted = await this.projectRepository.deleteByIdAndOrganisationId(
			id,
			context.organisationId,
		);

		if (!wasDeleted) {
			throw new HTTPError({
				message: ProjectValidationMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}
	}

	public async findAccessibleProjectIds(
		context: ProjectAccessContext,
	): Promise<number[]> {
		const user = await this.findActor(context);

		if (user.isOrganisationAdmin()) {
			return await this.projectRepository.findIdsByOrganisationId(
				context.organisationId,
			);
		}

		return await this.projectRepository.findIdsByOrganisationIdAndUserId(
			context.organisationId,
			context.userId,
		);
	}

	public async findAll(
		context: ProjectAccessContext,
	): Promise<ProjectGetAllResponseDto> {
		const user = await this.findActor(context);

		if (user.isOrganisationAdmin()) {
			const projects = await this.projectRepository.findAllByOrganisationId(
				context.organisationId,
			);

			return {
				items: this.sortWorkspaceProjects(
					projects.map((project) =>
						this.mapWorkspaceProject(project, ProjectMemberRole.ADMIN),
					),
				),
			};
		}

		const projects =
			await this.projectRepository.findAllByOrganisationIdAndUserId(
				context.organisationId,
				context.userId,
			);

		return {
			items: this.sortWorkspaceProjects(
				projects.map((project) =>
					this.mapWorkspaceProject(project, project.role),
				),
			),
		};
	}

	public async findById(
		id: number,
		context: ProjectAccessContext,
	): Promise<ProjectResponseDto> {
		const project = await this.findProjectOrThrow(id, context.organisationId);

		await this.assertProjectAccess(id, context);

		return this.mapProjectToResponse(project);
	}

	public async findMembers(
		id: number,
		context: ProjectAccessContext,
	): Promise<ProjectMembersResponseDto> {
		await this.assertOrganisationAdmin(context);
		await this.findProjectOrThrow(id, context.organisationId);

		return {
			items:
				await this.projectMemberRepository.findAllByProjectIdAndOrganisationId(
					id,
					context.organisationId,
				),
		};
	}

	public async update(
		id: number,
		payload: ProjectUpdateRequestDto,
		context: ProjectAccessContext,
	): Promise<ProjectResponseDto> {
		await this.assertOrganisationAdmin(context);

		const project = await this.projectRepository.updateByIdAndOrganisationId({
			id,
			organisationId: context.organisationId,
			payload: {
				...(payload.description !== undefined && {
					description: payload.description.trim(),
				}),
				...(payload.name !== undefined && {
					name: payload.name.trim(),
				}),
			},
		});

		if (!project) {
			throw new HTTPError({
				message: ProjectValidationMessage.NOT_FOUND,
				status: HTTPCode.NOT_FOUND,
			});
		}

		return this.mapProjectToResponse(project);
	}
}

export { ProjectService };
export { type ProjectAccessContext };
