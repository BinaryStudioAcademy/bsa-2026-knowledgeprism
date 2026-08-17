import { config } from "~/infrastructure/config/config.js";
import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { authController } from "~/modules/auth/index.js";
import { userController } from "~/modules/users/index.js";

import { BaseServerApplicationApi } from "./base-server-application-api.js";
import { BaseServerApplication } from "./base-server-application.js";

const apiV1 = new BaseServerApplicationApi(
	"v1",
	config,
	...authController.routes,
	...userController.routes,
);
const serverApplication = new BaseServerApplication({
	apis: [apiV1],
	config,
	database,
	logger,
	title: "AI Meeting Assistant",
});

export { serverApplication };
export { type ServerApplicationRouteParameters } from "./libs/types/types.js";
