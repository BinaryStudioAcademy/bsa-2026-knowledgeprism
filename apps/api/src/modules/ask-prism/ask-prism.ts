import { logger } from "~/infrastructure/logger/logger.js";
import { extractionItemRepository } from "~/modules/documents/documents.js";
import { knowledgeNodeRepository } from "~/modules/knowledge/knowledge.js";
import { projectService } from "~/modules/projects/projects.js";

import { AskPrismController } from "./controllers/ask-prism.controller.js";
import { AskPrismService } from "./services/ask-prism.service.js";

const askPrismService = new AskPrismService({
	extractionItemRepository,
	knowledgeNodeRepository,
	projectService,
});
const askPrismController = new AskPrismController(logger, askPrismService);

export { askPrismController };
