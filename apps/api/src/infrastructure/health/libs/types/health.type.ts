import { type HealthCheckResult } from "./types.js";

type Health = {
	getHealthStatus: () => Promise<HealthCheckResult>;
};

export { type Health };
