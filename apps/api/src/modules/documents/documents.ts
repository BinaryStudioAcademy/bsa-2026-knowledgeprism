import { logger } from "~/infrastructure/logger/logger.js";
import { generatePresignedUploadUrl } from "~/infrastructure/s3/presigned-url.js";
import { checkDocumentObjectExists } from "~/infrastructure/s3/verify-object.js";
import { sendDocumentProcessingJob } from "~/infrastructure/sqs/send-document-processing-job.js";
import { projectService } from "~/modules/projects/projects.js";

import { DocumentController } from "./controllers/document.controller.js";
import { DocumentModel } from "./models/document.model.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { DocumentAccessService } from "./services/document-access.service.js";
import { DocumentService } from "./services/document.service.js";

const documentRepository = new DocumentRepository(DocumentModel);
const documentAccessService = new DocumentAccessService();
const documentService = new DocumentService({
	checkDocumentObjectExists,
	documentAccessService,
	documentRepository,
	generatePresignedUploadUrl,
	logger,
	projectService,
	sendDocumentProcessingJob,
});
const documentController = new DocumentController(logger, documentService);

export { documentController };
