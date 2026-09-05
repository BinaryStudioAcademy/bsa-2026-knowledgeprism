import { config } from "~/infrastructure/config/config.js";
import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { s3Client } from "~/infrastructure/s3/s3.js";
import { authController } from "~/modules/auth/auth.js";
import { documentController } from "~/modules/documents/documents.js";
import { userController } from "~/modules/users/users.js";

import { BaseServerApplicationApi } from "./base-server-application-api.js";
import { BaseServerApplication } from "./base-server-application.js";

const apiV1 = new BaseServerApplicationApi(
	"v1",
	config,
	...documentController.routes,
	...authController.routes,
	...userController.routes,
);
const serverApplication = new BaseServerApplication({
	apis: [apiV1],
	config,
	database,
	logger,
	s3Client,
	title: "AI Meeting Assistant",
});

export { serverApplication };
export { type ServerApplicationRouteParameters } from "./libs/types/types.js";
