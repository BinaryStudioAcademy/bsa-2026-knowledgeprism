import { logger } from "~/infrastructure/logger/logger.js";

import { AskPrismController } from "./controllers/ask-prism.controller.js";
import { AskPrismService } from "./services/ask-prism.service.js";

const askPrismService = new AskPrismService();
const askPrismController = new AskPrismController(logger, askPrismService);

export { askPrismController };
