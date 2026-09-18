import { type Transaction } from "objection";

import { DatabaseTableName } from "~/infrastructure/database/database.js";
import { ProjectEntity } from "~/modules/projects/models/project.entity.js";
import { type ProjectModel } from "~/modules/projects/models/project.model.js";

type ProjectWorkspaceDatabaseRow = {
	description: null | string;
	id: number;
	latestKnowledgeUpdatedAt: Date | null;
	name: string;
	updatedAt: Date;
};

type ProjectWorkspaceMemberDatabaseRow = ProjectWorkspaceDatabaseRow & {
	role: "ADMIN" | "EDITOR" | "VIEWER";
};

type UpdateByIdAndOrganisationIdParameters = {
	id: number;
	organisationId: number;
	payload: {
		description?: string;
		name?: string;
	};
	transaction?: Transaction;
};

class ProjectRepository {
	private projectModel: typeof ProjectModel;

	public constructor(projectModel: typeof ProjectModel) {
		this.projectModel = projectModel;
	}

	public async create(
		entity: ProjectEntity,
		transaction?: Transaction,
	): Promise<ProjectEntity> {
		const { description, name, organisationId } = entity.toNewObject();

		const project = await this.projectModel
			.query(transaction)
			.insert({
				description,
				name,
				organisationId,
			})
			.returning("*")
			.execute();

		return ProjectEntity.initialize(project);
	}

	public async deleteByIdAndOrganisationId(
		id: number,
		organisationId: number,
		transaction?: Transaction,
	): Promise<boolean> {
		const deletedProjectsCount = await this.projectModel
			.query(transaction)
			.delete()
			.where({
				id,
				organisationId,
			})
			.execute();

		return Boolean(deletedProjectsCount);
	}

	public async findAllByOrganisationId(
		organisationId: number,
		transaction?: Transaction,
	): Promise<ProjectWorkspaceDatabaseRow[]> {
		return await this.projectModel
			.query(transaction)
			.alias("p")
			.leftJoin(
				`${DatabaseTableName.KNOWLEDGE_NODES} as kn`,
				"kn.projectId",
				"p.id",
			)
			.select(["p.description", "p.id", "p.name", "p.updatedAt"])
			.max("kn.updatedAt as latestKnowledgeUpdatedAt")
			.where("p.organisationId", organisationId)
			.groupBy(["p.description", "p.id", "p.name", "p.updatedAt"])
			.castTo<ProjectWorkspaceDatabaseRow[]>()
			.execute();
	}

	public async findAllByOrganisationIdAndUserId(
		organisationId: number,
		userId: number,
		transaction?: Transaction,
	): Promise<ProjectWorkspaceMemberDatabaseRow[]> {
		return await this.projectModel
			.query(transaction)
			.alias("p")
			.innerJoin(
				`${DatabaseTableName.PROJECT_MEMBERS} as pm`,
				"pm.projectId",
				"p.id",
			)
			.leftJoin(
				`${DatabaseTableName.KNOWLEDGE_NODES} as kn`,
				"kn.projectId",
				"p.id",
			)
			.select(["p.description", "p.id", "p.name", "p.updatedAt", "pm.role"])
			.max("kn.updatedAt as latestKnowledgeUpdatedAt")
			.where("p.organisationId", organisationId)
			.where("pm.userId", userId)
			.groupBy(["p.description", "p.id", "p.name", "p.updatedAt", "pm.role"])
			.castTo<ProjectWorkspaceMemberDatabaseRow[]>()
			.execute();
	}

	public async findByIdAndOrganisationId(
		id: number,
		organisationId: number,
		transaction?: Transaction,
	): Promise<null | ProjectEntity> {
		const project = await this.projectModel
			.query(transaction)
			.findOne({
				id,
				organisationId,
			})
			.execute();

		return project ? ProjectEntity.initialize(project) : null;
	}

	public async findIdsByOrganisationId(
		organisationId: number,
		transaction?: Transaction,
	): Promise<number[]> {
		const projects = await this.projectModel
			.query(transaction)
			.select("id")
			.where({ organisationId })
			.castTo<{ id: number }[]>()
			.execute();

		return projects.map((project) => project.id);
	}

	public async findIdsByOrganisationIdAndUserId(
		organisationId: number,
		userId: number,
		transaction?: Transaction,
	): Promise<number[]> {
		const projects = await this.projectModel
			.query(transaction)
			.alias("p")
			.innerJoin(
				`${DatabaseTableName.PROJECT_MEMBERS} as pm`,
				"pm.projectId",
				"p.id",
			)
			.select("p.id")
			.where("p.organisationId", organisationId)
			.where("pm.userId", userId)
			.castTo<{ id: number }[]>()
			.execute();

		return projects.map((project) => project.id);
	}

	public async updateByIdAndOrganisationId({
		id,
		organisationId,
		payload,
		transaction,
	}: UpdateByIdAndOrganisationIdParameters): Promise<null | ProjectEntity> {
		const updatedProjectsCount = await this.projectModel
			.query(transaction)
			.patch(payload)
			.where({
				id,
				organisationId,
			})
			.execute();

		if (!updatedProjectsCount) {
			return null;
		}

		return await this.findByIdAndOrganisationId(
			id,
			organisationId,
			transaction,
		);
	}
}

export { ProjectRepository };
