import { config } from "~/infrastructure/config/config.js";
import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { generatePresignedUploadUrl } from "~/infrastructure/s3/presigned-url.js";
import { checkDocumentObjectExists } from "~/infrastructure/s3/verify-object.js";
import { glossaryService } from "~/modules/glossary/glossary.js";
import { knowledgeNodeRepository } from "~/modules/knowledge/knowledge.js";
import { projectService } from "~/modules/projects/projects.js";

import { DocumentReviewController } from "./controllers/document-review.controller.js";
import { DocumentController } from "./controllers/document.controller.js";
import { ProcessingSweep } from "./libs/constants/processing-sweep.constant.js";
import { DocumentChunkModel } from "./models/document-chunk.model.js";
import { DocumentModel } from "./models/document.model.js";
import { ExtractionItemModel } from "./models/extraction-item.model.js";
import { ExtractionResponseModel } from "./models/extraction-response.model.js";
import { ExtractionRunModel } from "./models/extraction-run.model.js";
import { ExtractionSectionModel } from "./models/extraction-section.model.js";
import { IntegrationChangeModel } from "./models/integration-change.model.js";
import { DocumentRepository } from "./repositories/document.repository.js";
import { ExtractionItemRepository } from "./repositories/extraction-item.repository.js";
import { ExtractionRunRepository } from "./repositories/extraction-run.repository.js";
import { ExtractionSectionRepository } from "./repositories/extraction-section.repository.js";
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
const extractionRunRepository = new ExtractionRunRepository({
	documentChunkModel: DocumentChunkModel,
	extractionResponseModel: ExtractionResponseModel,
	extractionRunModel: ExtractionRunModel,
});
const extractionSectionRepository = new ExtractionSectionRepository(
	ExtractionSectionModel,
);
const integrationChangeRepository = new IntegrationChangeRepository(
	IntegrationChangeModel,
);
const documentProcessor = new DocumentProcessor({
	database,
	documentRepository,
	extractionChunkLength: config.ENV.EXTRACTION.CHUNK_LENGTH,
	extractionItemRepository,
	extractionRunRepository,
	glossaryService,
	logger,
});
const integrationAnalyzer = new IntegrationAnalyzer({
	database,
	documentRepository,
	extractionItemRepository,
	integrationChangeRepository,
	isNodeMergeEnabled: config.ENV.FEATURE.NODE_MERGE_LLM,
	knowledgeNodeRepository,
	logger,
});
const integrationApplier = new IntegrationApplier({
	extractionItemRepository,
	knowledgeNodeRepository,
	logger,
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
	extractionSectionRepository,
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
	void documentService.promoteAwaitingValidation();
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
