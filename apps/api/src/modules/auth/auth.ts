import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { EncryptService } from "~/libs/services/encrypt/encrypt.service.js";
import { TokenService } from "~/libs/services/token/token.service.js";
import { organisationService } from "~/modules/organisations/organisations.js";
import { userService } from "~/modules/users/users.js";

import { AuthController } from "./controllers/auth.controller.js";
import { AuthService } from "./services/auth.service.js";

const encryptService = new EncryptService();
const tokenService = new TokenService();

const authService = new AuthService({
	database,
	encryptService,
	organisationService,
	tokenService,
	userService,
});
const authController = new AuthController(logger, authService);

export { authController };
