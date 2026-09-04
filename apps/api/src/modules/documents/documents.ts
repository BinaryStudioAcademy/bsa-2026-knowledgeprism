import { config } from "~/infrastructure/config/config.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { s3Client } from "~/infrastructure/s3/s3.js";

import { DocumentController } from "./controllers/document.controller.js";
import { DocumentModel } from "./models/document.model.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { DocumentService } from "./services/document.service.js";

const documentRepository = new DocumentRepository(DocumentModel);
const documentService = new DocumentService({
	config,
	documentRepository,
	logger,
	s3Client,
});
const documentController = new DocumentController(logger, documentService);

export { documentController };
