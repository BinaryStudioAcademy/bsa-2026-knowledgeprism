import {
	DocumentErrorMessage,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { type ProcessingAttempt } from "~/modules/documents/libs/types/processing-attempt.type.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

import { type DocumentProcessor } from "./document-processor.js";
import { type IntegrationAnalyzer } from "./integration-analyzer.js";

type Constructor = {
	documentProcessor: DocumentProcessor;
	documentRepository: DocumentRepository;
	integrationAnalyzer: IntegrationAnalyzer;
	logger: Logger;
};

type DocumentJob = {
	errorMessage: ValueOf<typeof DocumentErrorMessage>;
	run: (processingAttempt: ProcessingAttempt) => Promise<boolean>;
	status: ValueOf<typeof DocumentStatus>;
};

class DocumentJobScheduler {
	private documentProcessor: DocumentProcessor;

	private documentRepository: DocumentRepository;

	private integrationAnalyzer: IntegrationAnalyzer;

	private logger: Logger;

	public constructor({
		documentProcessor,
		documentRepository,
		integrationAnalyzer,
		logger,
	}: Constructor) {
		this.documentProcessor = documentProcessor;
		this.documentRepository = documentRepository;
		this.integrationAnalyzer = integrationAnalyzer;
		this.logger = logger;
	}

	private async fail(
		{ errorMessage, status }: DocumentJob,
		{ attempt, documentId }: ProcessingAttempt,
	): Promise<void> {
		try {
			await this.documentRepository.compareAndSwapStatus({
				errorMessage,
				expectedStatus: status,
				id: documentId,
				processingAttempt: attempt,
				status: DocumentStatus.FAILED,
			});
		} catch (error) {
			this.logger.error("Failed to mark document as failed.", {
				documentId,
				error,
			});
		}
	}

	private async run(
		job: DocumentJob,
		processingAttempt: ProcessingAttempt,
	): Promise<void> {
		try {
			const isCompleted = await job.run(processingAttempt);

			if (!isCompleted) {
				this.logger.warn(
					"Discarded results of a superseded processing attempt.",
					{ ...processingAttempt, status: job.status },
				);
			}
		} catch (error) {
			this.logger.error("Failed to process document.", {
				...processingAttempt,
				error,
				status: job.status,
			});

			await this.fail(job, processingAttempt);
		}
	}

	private schedule(
		job: DocumentJob,
		processingAttempt: ProcessingAttempt,
	): void {
		setImmediate(() => {
			void this.run(job, processingAttempt);
		});
	}

	public scheduleIntegration(processingAttempt: ProcessingAttempt): void {
		this.schedule(
			{
				errorMessage: DocumentErrorMessage.INTEGRATION_FAILED,
				run: (attempt) => this.integrationAnalyzer.process(attempt),
				status: DocumentStatus.INTEGRATING,
			},
			processingAttempt,
		);
	}

	public scheduleProcessing(processingAttempt: ProcessingAttempt): void {
		this.schedule(
			{
				errorMessage: DocumentErrorMessage.PROCESSING_FAILED,
				run: (attempt) => this.documentProcessor.process(attempt),
				status: DocumentStatus.PROCESSING,
			},
			processingAttempt,
		);
	}
}

export { DocumentJobScheduler };
