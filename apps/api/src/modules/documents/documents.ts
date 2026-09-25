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
import { IntegrationChangeModel } from "./models/integration-change.model.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { ExtractionItemRepository } from "./repositories/extraction-item.repository.js";
import { IntegrationChangeRepository } from "./repositories/integration-change.repository.js";
import { DocumentJobScheduler } from "./services/document-job-scheduler.js";
import { DocumentProcessor } from "./services/document-processor.js";
import { DocumentReviewService } from "./services/document-review.service.js";
import { DocumentService } from "./services/document.service.js";
import { IntegrationAnalyzer } from "./services/integration-analyzer.js";
import { IntegrationApplier } from "./services/integration-applier.js";

const documentRepository = new DocumentRepository(DocumentModel);
const extractionItemRepository = new ExtractionItemRepository(
	ExtractionItemModel,
);
const integrationChangeRepository = new IntegrationChangeRepository(
	IntegrationChangeModel,
);
const documentProcessor = new DocumentProcessor({
	database,
	documentRepository,
	extractionItemRepository,
});
const integrationAnalyzer = new IntegrationAnalyzer({
	database,
	documentRepository,
	extractionItemRepository,
	integrationChangeRepository,
	knowledgeNodeRepository,
});
const integrationApplier = new IntegrationApplier({
	extractionItemRepository,
	knowledgeNodeRepository,
});
const documentJobScheduler = new DocumentJobScheduler({
	documentProcessor,
	documentRepository,
	integrationAnalyzer,
	logger,
});
const documentService = new DocumentService({
	checkDocumentObjectExists,
	documentJobScheduler,
	documentRepository,
	extractionItemRepository,
	generatePresignedUploadUrl,
	logger,
	projectService,
});
const documentReviewService = new DocumentReviewService({
	database,
	documentJobScheduler,
	documentRepository,
	extractionItemRepository,
	integrationApplier,
	integrationChangeRepository,
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
