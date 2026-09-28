import { TimeMs } from "@knowledgeprism/constants";
import { type Transaction } from "objection";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { type DeleteObjectsByPrefix } from "~/infrastructure/s3/delete-objects.js";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "~/infrastructure/s3/libs/helpers/helpers.js";
import { ProjectStorageCleanupStatus } from "~/modules/projects/libs/enums/enums.js";
import { ProjectStorageCleanupEntity } from "~/modules/projects/models/project-storage-cleanup.entity.js";
import { type ProjectStorageCleanupRepository } from "~/modules/projects/repositories/project-storage-cleanup.repository.js";

const CLEANUP_SWEEP_INTERVAL_MS = TimeMs.MINUTE;
const DEFAULT_BATCH_SIZE = 50;
const DEFAULT_MAX_RETRIES = 3;
const EMPTY_COUNT = 0;
const MILLISECONDS_IN_SECOND = 1000;
const RETRY_ATTEMPT_INCREMENT = 1;

const DEFAULT_DELAYED_SWEEP_DELAY_MS =
	PRESIGNED_URL_EXPIRY_SECONDS * MILLISECONDS_IN_SECOND;

type Constructor = {
	cleanupSweepIntervalMs?: number;
	delayedSweepDelayMs?: number;
	deleteObjectsByPrefix: DeleteObjectsByPrefix;
	logger: Logger;
	maxRetries?: number;
	projectStorageCleanupRepository: ProjectStorageCleanupRepository;
};

class ProjectStorageCleanupService {
	private cleanupSweepIntervalMs: number;

	private delayedSweepDelayMs: number;

	private deleteObjectsByPrefix: DeleteObjectsByPrefix;

	private logger: Logger;

	private maxRetries: number;

	private projectStorageCleanupRepository: ProjectStorageCleanupRepository;

	public constructor({
		cleanupSweepIntervalMs = CLEANUP_SWEEP_INTERVAL_MS,
		delayedSweepDelayMs = DEFAULT_DELAYED_SWEEP_DELAY_MS,
		deleteObjectsByPrefix,
		logger,
		maxRetries = DEFAULT_MAX_RETRIES,
		projectStorageCleanupRepository,
	}: Constructor) {
		this.cleanupSweepIntervalMs = cleanupSweepIntervalMs;
		this.delayedSweepDelayMs = delayedSweepDelayMs;
		this.deleteObjectsByPrefix = deleteObjectsByPrefix;
		this.logger = logger;
		this.maxRetries = maxRetries;
		this.projectStorageCleanupRepository = projectStorageCleanupRepository;
	}

	private getProjectPrefix(projectId: number): string {
		return `projects/${projectId.toString()}/`;
	}

	public async createCleanupTasks(
		projectId: number,
		transaction?: Transaction,
	): Promise<void> {
		const prefix = this.getProjectPrefix(projectId);
		const now = new Date();
		const delayedExecutionTime = new Date(
			now.getTime() + this.delayedSweepDelayMs,
		);

		const immediateEntity = ProjectStorageCleanupEntity.initializeNew({
			executeAfter: now,
			prefix,
			projectId,
			status: ProjectStorageCleanupStatus.PENDING,
		});

		const delayedEntity = ProjectStorageCleanupEntity.initializeNew({
			executeAfter: delayedExecutionTime,
			prefix,
			projectId,
			status: ProjectStorageCleanupStatus.PENDING,
		});

		await this.projectStorageCleanupRepository.create({
			entity: immediateEntity,
			transaction,
		});

		await this.projectStorageCleanupRepository.create({
			entity: delayedEntity,
			transaction,
		});
	}

	public async processDueCleanups(): Promise<void> {
		const dueCleanups =
			await this.projectStorageCleanupRepository.findDueCleanups({
				limit: DEFAULT_BATCH_SIZE,
				maxAttempts: this.maxRetries,
			});

		for (const cleanup of dueCleanups) {
			const { attempts, id, prefix, projectId } = cleanup.toObject();

			await this.projectStorageCleanupRepository.updateStatus({
				id,
				status: ProjectStorageCleanupStatus.PROCESSING,
			});

			try {
				const deletedCount = await this.deleteObjectsByPrefix({ prefix });

				await this.projectStorageCleanupRepository.updateStatus({
					id,
					status: ProjectStorageCleanupStatus.COMPLETED,
				});

				if (deletedCount > EMPTY_COUNT) {
					this.logger.info("Successfully cleaned up project S3 storage.", {
						deletedCount,
						id,
						prefix,
						projectId,
					});
				}
			} catch (error) {
				const nextAttempts = attempts + RETRY_ATTEMPT_INCREMENT;
				const isExhausted = nextAttempts >= this.maxRetries;
				const errorMessage =
					error instanceof Error ? error.message : "Unknown error";

				this.logger.warn(
					`Failed to clean up project S3 storage (attempt ${nextAttempts.toString()} of ${this.maxRetries.toString()}).`,
					{
						attempts: nextAttempts,
						error,
						id,
						prefix,
						projectId,
					},
				);

				await this.projectStorageCleanupRepository.updateStatus({
					attempts: nextAttempts,
					errorMessage,
					id,
					status: isExhausted
						? ProjectStorageCleanupStatus.FAILED
						: ProjectStorageCleanupStatus.PENDING,
				});
			}
		}
	}

	public startPeriodicSweep(): void {
		void this.processDueCleanups();
		setInterval(() => {
			void this.processDueCleanups();
		}, this.cleanupSweepIntervalMs);
	}

	public triggerImmediateCleanups(): void {
		setImmediate(() => {
			void this.processDueCleanups();
		});
	}
}

export { ProjectStorageCleanupService };
