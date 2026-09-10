import { logger } from "~/infrastructure/logger/logger.js";
import { generatePresignedUploadUrl } from "~/infrastructure/s3/presigned-url.js";

import { DocumentController } from "./controllers/document.controller.js";
import { DocumentModel } from "./models/document.model.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { DocumentService } from "./services/document.service.js";

const documentRepository = new DocumentRepository(DocumentModel);
const documentService = new DocumentService({
	documentRepository,
	generatePresignedUploadUrl,
	logger,
});
const documentController = new DocumentController(logger, documentService);

export { documentController };
