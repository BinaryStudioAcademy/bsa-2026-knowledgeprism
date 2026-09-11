import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { fetchDocumentObjectBytes } from "~/infrastructure/s3/download-object.js";
import { generatePresignedUploadUrl } from "~/infrastructure/s3/presigned-url.js";

import { DocumentController } from "./controllers/document.controller.js";
import { DocumentBlockModel } from "./models/document-block.model.js";
import { DocumentModel } from "./models/document.model.js";
import { DocumentBlockRepository } from "./repositories/document-block.repository.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { DocumentService } from "./services/document.service.js";

const documentBlockRepository = new DocumentBlockRepository(DocumentBlockModel);
const documentRepository = new DocumentRepository(DocumentModel);
const documentService = new DocumentService({
	documentBlockRepository,
	documentRepository,
	fetchDocumentObjectBytes,
	generatePresignedUploadUrl,
	logger,
	runInTransaction: database.transaction.bind(database),
});
const documentController = new DocumentController(logger, documentService);

export { documentController };
