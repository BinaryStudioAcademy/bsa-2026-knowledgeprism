import { logger } from "~/infrastructure/logger/logger.js";
import { projectService } from "~/modules/projects/projects.js";

import { KnowledgeController } from "./controllers/knowledge.controller.js";
import { KnowledgeNodeModel } from "./models/knowledge-node.model.js";
import { KnowledgeNodeRepository } from "./repositories/knowledge-node.repository.js";
import { KnowledgeService } from "./services/knowledge.service.js";

const knowledgeNodeRepository = new KnowledgeNodeRepository(KnowledgeNodeModel);
const knowledgeService = new KnowledgeService({
	knowledgeNodeRepository,
	logger,
	projectService,
});
const knowledgeController = new KnowledgeController(logger, knowledgeService);

export { knowledgeController };
