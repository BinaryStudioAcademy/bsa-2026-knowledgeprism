import { type ProjectAssignmentDto } from "@knowledgeprism/types";

import { ProjectMemberModel } from "~/modules/projects/models/project-member.model.js";
import { UserEntity } from "~/modules/users/models/user.entity.js";
import { type UserModel } from "~/modules/users/models/user.model.js";
import { type Repository } from "~/shared/types/types.js";

type UserDatabaseRow = {
	email: string;
	firstName: null | string;
	id: number;
	lastName: null | string;
	organisationId: null | number;
	passwordHash: string;
	projectMembers?: ProjectMemberModel[];
	status: "active" | "inactive";
};

class UserRepository implements Repository {
	private userModel: typeof UserModel;

	public constructor(userModel: typeof UserModel) {
		this.userModel = userModel;
	}

	private mapToEntity(row: unknown): UserEntity {
		const typedUser = row as UserDatabaseRow;

		return UserEntity.initialize({
			...typedUser,
			assignedProjects:
				typedUser.projectMembers?.map((pm) => ({
					projectId: pm.projectId,
					role: pm.role,
				})) ?? [],
		});
	}

	public async create(entity: UserEntity): Promise<UserEntity> {
		const { email, firstName, lastName, organisationId, passwordHash, status } =
			entity.toNewObject();

		const user = await this.userModel
			.query()
			.insert({
				email,
				firstName,
				lastName,
				organisationId,
				passwordHash,
				status,
			})
			.returning("*")
			.execute();

		const typedUser = user as unknown as UserDatabaseRow;

		return UserEntity.initialize({
			...typedUser,
			assignedProjects: [],
		});
	}

	public async createOrgUser(
		entity: UserEntity,
		assignedProjects: ProjectAssignmentDto[],
	): Promise<UserEntity> {
		const { email, firstName, lastName, organisationId, passwordHash, status } =
			entity.toNewObject();
		const EMPTY_LENGTH = 0;

		const user = await this.userModel.transaction(async (trx) => {
			const insertedUser = await this.userModel
				.query(trx)
				.insert({
					email,
					firstName,
					lastName,
					organisationId,
					passwordHash,
					status,
				})
				.returning("*")
				.execute();

			if (assignedProjects.length > EMPTY_LENGTH) {
				const projectMembersToInsert = assignedProjects.map((project) => ({
					projectId: project.projectId,
					role: project.role,
					userId: insertedUser.id,
				}));

				await ProjectMemberModel.query(trx).insert(projectMembersToInsert);
			}

			return await this.userModel
				.query(trx)
				.findById(insertedUser.id)
				.withGraphFetched("projectMembers")
				.execute();
		});

		return this.mapToEntity(user);
	}

	public delete(): ReturnType<Repository["delete"]> {
		return Promise.resolve(true);
	}

	public find(): ReturnType<Repository["find"]> {
		return Promise.resolve(null);
	}

	public async findAll(): Promise<UserEntity[]> {
		const users = await this.userModel.query().execute();

		return users.map((user) =>
			UserEntity.initialize({
				...(user as unknown as UserDatabaseRow),
				assignedProjects: [],
			}),
		);
	}

	public async findAllByOrgId(organisationId: number): Promise<UserEntity[]> {
		const users = await this.userModel
			.query()
			.where({ organisationId })
			.withGraphFetched("projectMembers")
			.execute();

		return users.map((user) => this.mapToEntity(user));
	}

	public async findByEmail(email: string): Promise<null | UserEntity> {
		const user = await this.userModel
			.query()
			.findOne({ email })
			.withGraphFetched("projectMembers")
			.execute();

		if (!user) {
			return null;
		}

		return this.mapToEntity(user);
	}

	public async findDetailsById(
		id: number,
		organisationId: number,
	): Promise<null | UserEntity> {
		const user = await this.userModel
			.query()
			.findOne({ id, organisationId })
			.withGraphFetched("projectMembers")
			.execute();

		if (!user) {
			return null;
		}

		return this.mapToEntity(user);
	}

	public update(): ReturnType<Repository["update"]> {
		return Promise.resolve(null);
	}

	public async updateOrgUser({
		assignedProjects,
		entity,
		id,
		organisationId,
	}: {
		assignedProjects?: ProjectAssignmentDto[];
		entity: Partial<ReturnType<UserEntity["toNewObject"]>>;
		id: number;
		organisationId: number;
	}): Promise<null | UserEntity> {
		const EMPTY_LENGTH = 0;

		const updatedUser = await this.userModel.transaction(async (trx) => {
			await this.userModel
				.query(trx)
				.patchAndFetchById(id, entity)
				.where({ organisationId })
				.execute();

			if (assignedProjects) {
				await ProjectMemberModel.query(trx).delete().where({ userId: id });

				if (assignedProjects.length > EMPTY_LENGTH) {
					const projectMembersToInsert = assignedProjects.map((project) => ({
						projectId: project.projectId,
						role: project.role,
						userId: id,
					}));

					await ProjectMemberModel.query(trx).insert(projectMembersToInsert);
				}
			}

			return await this.userModel
				.query(trx)
				.findById(id)
				.withGraphFetched("projectMembers")
				.execute();
		});

		return this.mapToEntity(updatedUser);
	}
}

export { UserRepository };
