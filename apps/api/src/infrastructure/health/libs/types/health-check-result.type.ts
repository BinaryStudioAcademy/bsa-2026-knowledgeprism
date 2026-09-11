import { type ValueOf } from "~/shared/types/types.js";

import { type HealthStatus } from "../enums/enums.js";

type HealthCheckResult = {
	database: { connected: boolean; migrationsRun: string[] };
	status: ValueOf<typeof HealthStatus>;
};

export { type HealthCheckResult };
