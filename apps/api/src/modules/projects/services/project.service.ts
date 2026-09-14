import {
	HTTPCode,
	ProjectValidationMessage,
	UserStatus,
	UserValidationMessage,
} from "@knowledgeprism/constants";
import {
	type ProjectCreateRequestDto,
	type ProjectMemberCreateRequestDto,
	type ProjectMemberResponseDto,
	type ProjectMembersResponseDto,
	type ProjectResponseDto,
} from "@knowledgeprism/types";
import { ForeignKeyViolationError, UniqueViolationError } from "objection";

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

	private async assertProjectAccess(
		projectId: number,
		context: ProjectAccessContext,
	): Promise<void> {
		const user = await this.findActor(context);

		if (user.isOrganisationAdmin()) {
			return;
		}

		const isProjectMember = await this.projectMemberRepository.exists(
			projectId,
			context.userId,
		);

		if (!isProjectMember) {
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
			if (error instanceof UniqueViolationError) {
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

		try {
			const wasDeleted =
				await this.projectRepository.deleteByIdAndOrganisationId(
					id,
					context.organisationId,
				);

			if (!wasDeleted) {
				throw new HTTPError({
					message: ProjectValidationMessage.NOT_FOUND,
					status: HTTPCode.NOT_FOUND,
				});
			}
		} catch (error) {
			if (
				error instanceof ForeignKeyViolationError &&
				error.constraint === DatabaseConstraintName.DOCUMENTS_PROJECT_ID_FOREIGN
			) {
				throw new HTTPError({
					cause: error,
					message: ProjectValidationMessage.HAS_DOCUMENTS,
					status: HTTPCode.CONFLICT,
				});
			}

			throw error;
		}
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
		await this.findProjectOrThrow(id, context.organisationId);
		await this.assertProjectAccess(id, context);

		return {
			items:
				await this.projectMemberRepository.findAllByProjectIdAndOrganisationId(
					id,
					context.organisationId,
				),
		};
	}
}

export { ProjectService };
