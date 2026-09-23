import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { generatePresignedUploadUrl } from "~/infrastructure/s3/presigned-url.js";
import { checkDocumentObjectExists } from "~/infrastructure/s3/verify-object.js";
import { knowledgeNodeRepository } from "~/modules/knowledge/knowledge.js";
import { projectService } from "~/modules/projects/projects.js";

import { DocumentReviewController } from "./controllers/document-review.controller.js";
import { DocumentController } from "./controllers/document.controller.js";
import { ProcessingSweep } from "./libs/constants/processing-sweep.constant.js";
import { DocumentModel } from "./models/document.model.js";
import { ExtractionItemModel } from "./models/extraction-item.model.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { ExtractionItemRepository } from "./repositories/extraction-item.repository.js";
import { DocumentProcessor } from "./services/document-processor.js";
import { DocumentReviewService } from "./services/document-review.service.js";
import { DocumentService } from "./services/document.service.js";

const documentRepository = new DocumentRepository(DocumentModel);
const extractionItemRepository = new ExtractionItemRepository(
	ExtractionItemModel,
);
const documentProcessor = new DocumentProcessor({
	documentRepository,
	extractionItemRepository,
});
const documentService = new DocumentService({
	checkDocumentObjectExists,
	documentProcessor,
	documentRepository,
	generatePresignedUploadUrl,
	logger,
	projectService,
});
const documentReviewService = new DocumentReviewService({
	database,
	documentRepository,
	extractionItemRepository,
	knowledgeNodeRepository,
	projectService,
});
const documentController = new DocumentController(logger, documentService);
const documentReviewController = new DocumentReviewController(
	logger,
	documentReviewService,
);

const sweepStaleProcessing = (): void => {
	void documentService.failStaleProcessing();
};

const startStaleProcessingSweep = (): void => {
	sweepStaleProcessing();
	setInterval(sweepStaleProcessing, ProcessingSweep.INTERVAL_MS);
};

export {
	documentController,
	documentReviewController,
	startStaleProcessingSweep,
};
