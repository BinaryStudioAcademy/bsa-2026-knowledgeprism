import { type Transaction } from "objection";

import { ProjectEntity } from "~/modules/projects/models/project.entity.js";
import { type ProjectModel } from "~/modules/projects/models/project.model.js";

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
}

export { ProjectRepository };
