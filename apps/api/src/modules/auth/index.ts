import { logger } from "~/infrastructure/logger/logger.js";
import { userService } from "~/modules/users/index.js";

import { AuthController } from "./controllers/auth.controller.js";
import { AuthService } from "./services/auth.service.js";

const authService = new AuthService(userService);
const authController = new AuthController(logger, authService);

export { authController };
