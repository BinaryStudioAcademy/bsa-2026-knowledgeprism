import { type HealthCheckResult } from "./health-check-result.type.js";

type Health = {
	getHealthStatus: () => Promise<HealthCheckResult>;
};

export { type Health };
