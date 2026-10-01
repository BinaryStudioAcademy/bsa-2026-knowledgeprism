import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { projectService } from "~/modules/projects/projects.js";

import { GlossaryController } from "./controllers/glossary.controller.js";
import { GlossaryTermRelationModel } from "./models/glossary-term-relation.model.js";
import { GlossaryTermModel } from "./models/glossary-term.model.js";
import { GlossaryTermRelationRepository } from "./repositories/glossary-term-relation.repository.js";
import { GlossaryTermRepository } from "./repositories/glossary-term.repository.js";
import { GlossaryService } from "./services/glossary.service.js";

const glossaryService = new GlossaryService({
	database,
	glossaryTermRelationRepository: new GlossaryTermRelationRepository(
		GlossaryTermRelationModel,
	),
	glossaryTermRepository: new GlossaryTermRepository(GlossaryTermModel),
	logger,
	projectService,
});
const glossaryController = new GlossaryController(logger, glossaryService);

export { glossaryController, glossaryService };
