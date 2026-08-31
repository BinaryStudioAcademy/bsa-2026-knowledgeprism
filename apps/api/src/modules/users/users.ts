import { logger } from "~/infrastructure/logger/logger.js";
import { EncryptService } from "~/libs/services/encrypt/encrypt.service.js";

import { UserController } from "./controllers/user.controller.js";
import { UserModel } from "./models/user.model.js";
import { UserRepository } from "./repositories/user.repository.js";
import { UserService } from "./services/user.service.js";

const encryptService = new EncryptService();
const userRepository = new UserRepository(UserModel);
const userService = new UserService(encryptService, userRepository);
const userController = new UserController(logger, userService);

export { userController, userService };
