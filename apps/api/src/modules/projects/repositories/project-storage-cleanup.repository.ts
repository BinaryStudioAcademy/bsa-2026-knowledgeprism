import { type ValueOf } from "@knowledgeprism/types";
import { type Transaction } from "objection";

import { ProjectStorageCleanupStatus } from "~/modules/projects/libs/enums/enums.js";
import { ProjectStorageCleanupEntity } from "~/modules/projects/models/project-storage-cleanup.entity.js";
import { type ProjectStorageCleanupModel } from "~/modules/projects/models/project-storage-cleanup.model.js";

type CreateParameters = {
	entity: ProjectStorageCleanupEntity;
	transaction?: Transaction | undefined;
};

type FindDueCleanupsParameters = {
	limit: number;
	maxAttempts: number;
};

type UpdateStatusParameters = {
	attempts?: number | undefined;
	errorMessage?: null | string | undefined;
	id: number;
	status: ValueOf<typeof ProjectStorageCleanupStatus>;
	transaction?: Transaction | undefined;
};

class ProjectStorageCleanupRepository {
	private projectStorageCleanupModel: typeof ProjectStorageCleanupModel;

	public constructor(
		projectStorageCleanupModel: typeof ProjectStorageCleanupModel,
	) {
		this.projectStorageCleanupModel = projectStorageCleanupModel;
	}

	public async create({
		entity,
		transaction,
	}: CreateParameters): Promise<ProjectStorageCleanupEntity> {
		const { attempts, errorMessage, executeAfter, prefix, projectId, status } =
			entity.toNewObject();

		const cleanup = await this.projectStorageCleanupModel
			.query(transaction)
			.insert({
				attempts,
				errorMessage,
				executeAfter,
				prefix,
				projectId,
				status,
			})
			.returning("*")
			.execute();

		return ProjectStorageCleanupEntity.initialize(cleanup);
	}

	public async findDueCleanups({
		limit,
		maxAttempts,
	}: FindDueCleanupsParameters): Promise<ProjectStorageCleanupEntity[]> {
		const cleanups = await this.projectStorageCleanupModel
			.query()
			.where("execute_after", "<=", new Date())
			.whereIn("status", [
				ProjectStorageCleanupStatus.PENDING,
				ProjectStorageCleanupStatus.FAILED,
			])
			.where("attempts", "<", maxAttempts)
			.orderBy("execute_after", "asc")
			.limit(limit)
			.execute();

		return cleanups.map((cleanup) =>
			ProjectStorageCleanupEntity.initialize(cleanup),
		);
	}

	public async updateStatus({
		attempts,
		errorMessage,
		id,
		status,
		transaction,
	}: UpdateStatusParameters): Promise<ProjectStorageCleanupEntity> {
		const patchData: {
			attempts?: number;
			errorMessage?: null | string;
			status: ValueOf<typeof ProjectStorageCleanupStatus>;
		} = { status };

		if (attempts !== undefined) {
			patchData.attempts = attempts;
		}

		if (errorMessage !== undefined) {
			patchData.errorMessage = errorMessage;
		}

		const updated = await this.projectStorageCleanupModel
			.query(transaction)
			.patchAndFetchById(id, patchData)
			.execute();

		return ProjectStorageCleanupEntity.initialize(updated);
	}
}

export { ProjectStorageCleanupRepository };
