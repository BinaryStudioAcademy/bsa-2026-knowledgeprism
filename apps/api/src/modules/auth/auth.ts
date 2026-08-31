import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { organisationService } from "~/modules/organisations/organisations.js";
import { userService } from "~/modules/users/users.js";

import { AuthController } from "./controllers/auth.controller.js";
import { AuthService } from "./services/auth.service.js";

const authService = new AuthService(userService, organisationService, database);
const authController = new AuthController(logger, authService);

export { authController };
