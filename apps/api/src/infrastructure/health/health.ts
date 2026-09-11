import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";

import { BaseHealthChecker } from "./base-health.module.js";

const health = new BaseHealthChecker(database, logger);

export { health };
export { HealthStatus } from "./libs/enums/enums.js";
export { type Health } from "./libs/types/types.js";
