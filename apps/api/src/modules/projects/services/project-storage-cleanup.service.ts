import { type Logger } from "~/infrastructure/logger/logger.js";
import { type DeleteObjectsByPrefix } from "~/infrastructure/s3/delete-objects.js";
import { PRESIGNED_URL_EXPIRY_SECONDS } from "~/infrastructure/s3/libs/helpers/helpers.js";

const DEFAULT_INITIAL_RETRY_DELAY_MS = 1000;
const DEFAULT_MAX_RETRIES = 3;
const EMPTY_COUNT = 0;
const FIRST_ATTEMPT = 1;
const MILLISECONDS_IN_SECOND = 1000;
const RETRY_ATTEMPT_INCREMENT = 1;
const RETRY_BACKOFF_FACTOR = 2;

const DEFAULT_DELAYED_SWEEP_DELAY_MS =
	PRESIGNED_URL_EXPIRY_SECONDS * MILLISECONDS_IN_SECOND;

type Constructor = {
	delayedSweepDelayMs?: number;
	deleteObjectsByPrefix: DeleteObjectsByPrefix;
	initialRetryDelayMs?: number;
	logger: Logger;
	maxRetries?: number;
};

class ProjectStorageCleanupService {
	private delayedSweepDelayMs: number;

	private deleteObjectsByPrefix: DeleteObjectsByPrefix;

	private initialRetryDelayMs: number;

	private logger: Logger;

	private maxRetries: number;

	public constructor({
		delayedSweepDelayMs = DEFAULT_DELAYED_SWEEP_DELAY_MS,
		deleteObjectsByPrefix,
		initialRetryDelayMs = DEFAULT_INITIAL_RETRY_DELAY_MS,
		logger,
		maxRetries = DEFAULT_MAX_RETRIES,
	}: Constructor) {
		this.delayedSweepDelayMs = delayedSweepDelayMs;
		this.deleteObjectsByPrefix = deleteObjectsByPrefix;
		this.initialRetryDelayMs = initialRetryDelayMs;
		this.logger = logger;
		this.maxRetries = maxRetries;
	}

	private getProjectPrefix(projectId: number): string {
		return `projects/${projectId.toString()}/`;
	}

	public async cleanupProjectStorage(projectId: number): Promise<boolean> {
		const prefix = this.getProjectPrefix(projectId);
		let delay = this.initialRetryDelayMs;

		for (
			let attempt = FIRST_ATTEMPT;
			attempt <= this.maxRetries;
			attempt += RETRY_ATTEMPT_INCREMENT
		) {
			try {
				const deletedCount = await this.deleteObjectsByPrefix({ prefix });

				if (deletedCount > EMPTY_COUNT) {
					this.logger.info("Successfully cleaned up project S3 storage.", {
						deletedCount,
						prefix,
						projectId,
					});
				}

				return true;
			} catch (error) {
				this.logger.warn(
					`Failed to clean up project S3 storage (attempt ${attempt.toString()} of ${this.maxRetries.toString()}).`,
					{
						attempt,
						error,
						prefix,
						projectId,
					},
				);

				if (attempt < this.maxRetries) {
					await new Promise((resolve) => {
						setTimeout(resolve, delay);
					});
					delay *= RETRY_BACKOFF_FACTOR;
				}
			}
		}

		this.logger.error(
			"Exhausted all retries attempting to clean up project S3 storage.",
			{
				maxRetries: this.maxRetries,
				prefix,
				projectId,
			},
		);

		return false;
	}

	public scheduleCleanup(projectId: number): void {
		setImmediate(() => {
			void this.cleanupProjectStorage(projectId);
		});

		setTimeout(() => {
			void this.cleanupProjectStorage(projectId);
		}, this.delayedSweepDelayMs);
	}
}

export { ProjectStorageCleanupService };
