import { logger } from "~/infrastructure/logger/logger.js";

import { KnowledgeController } from "./controllers/knowledge.controller.js";
import { KnowledgeService } from "./services/knowledge.service.js";

const knowledgeService = new KnowledgeService();

const knowledgeController = new KnowledgeController(logger, knowledgeService);

export { knowledgeController };
