import { type Database } from "~/infrastructure/database/database.js";
import { type Logger } from "~/infrastructure/logger/logger.js";

import { HealthStatus } from "./libs/enums/enums.js";
import { type Health, type HealthCheckResult } from "./libs/types/types.js";

class BaseHealth implements Health {
	private database: Database;

	private logger: Logger;

	public constructor(database: Database, logger: Logger) {
		this.database = database;
		this.logger = logger;
	}

	public async getHealthStatus(): Promise<HealthCheckResult> {
		try {
			await this.database.client.raw("select 1");

			const [completedMigrations] =
				(await this.database.client.migrate.list()) as [string[], unknown];

			return {
				database: {
					connected: true,
					migrationsRun: completedMigrations,
				},
				status: HealthStatus.OK,
			};
		} catch (error) {
			this.logger.error("[Health Check] Database check failed", {
				error: error instanceof Error ? error.message : String(error),
			});

			return {
				database: { connected: false, migrationsRun: [] },
				status: HealthStatus.DEGRADED,
			};
		}
	}
}

export { BaseHealth as BaseHealthChecker };
