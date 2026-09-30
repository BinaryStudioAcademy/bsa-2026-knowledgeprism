import {
	DocumentErrorMessage,
	DocumentStatus,
} from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { ProcessingSweep } from "~/modules/documents/libs/constants/processing-sweep.constant.js";
import { DocumentProcessingError } from "~/modules/documents/libs/exceptions/document-processing.exception.js";
import { type ProcessingAttempt } from "~/modules/documents/libs/types/processing-attempt.type.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";

import { type DocumentProcessor } from "./document-processor.js";
import { type IntegrationAnalyzer } from "./integration-analyzer.js";

type Constructor = {
	documentProcessor: DocumentProcessor;
	documentRepository: DocumentRepository;
	integrationAnalyzer: IntegrationAnalyzer;
	intervalScheduler?: IntervalScheduler;
	logger: Logger;
};

type DocumentJob = {
	errorMessage: string;
	run: (processingAttempt: ProcessingAttempt) => Promise<boolean>;
	status: ValueOf<typeof DocumentStatus>;
};

type IntervalScheduler = {
	clear: (interval: ScheduledInterval) => void;
	repeat: (callback: () => void, intervalMs: number) => ScheduledInterval;
};

type ScheduledInterval = ReturnType<typeof setInterval>;

const EMPTY_MESSAGE_LENGTH = 0;

const DEFAULT_INTERVAL_SCHEDULER: IntervalScheduler = {
	clear: clearInterval,
	repeat: setInterval,
};

const resolveFailureMessage = (error: unknown, fallback: string): string => {
	if (error instanceof DocumentProcessingError) {
		return error.documentErrorMessage;
	}

	if (error instanceof Error) {
		const message = error.message.trim();

		if (message.length > EMPTY_MESSAGE_LENGTH) {
			return message;
		}
	}

	return fallback;
};

class DocumentJobScheduler {
	private documentProcessor: DocumentProcessor;

	private documentRepository: DocumentRepository;

	private integrationAnalyzer: IntegrationAnalyzer;

	private intervalScheduler: IntervalScheduler;

	private logger: Logger;

	public constructor({
		documentProcessor,
		documentRepository,
		integrationAnalyzer,
		intervalScheduler = DEFAULT_INTERVAL_SCHEDULER,
		logger,
	}: Constructor) {
		this.documentProcessor = documentProcessor;
		this.documentRepository = documentRepository;
		this.integrationAnalyzer = integrationAnalyzer;
		this.intervalScheduler = intervalScheduler;
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
		const heartbeatInterval = this.startHeartbeat(job, processingAttempt);

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

			const failedJob = {
				...job,
				errorMessage: resolveFailureMessage(error, job.errorMessage),
			};

			await this.fail(failedJob, processingAttempt);
		} finally {
			this.intervalScheduler.clear(heartbeatInterval);
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

	private startHeartbeat(
		job: DocumentJob,
		processingAttempt: ProcessingAttempt,
	): ScheduledInterval {
		let isHeartbeatPending = false;
		const heartbeatInterval = this.intervalScheduler.repeat(() => {
			if (isHeartbeatPending) {
				return;
			}

			isHeartbeatPending = true;
			void this.updateHeartbeat(job, processingAttempt)
				.then((isCurrentAttempt) => {
					if (!isCurrentAttempt) {
						this.intervalScheduler.clear(heartbeatInterval);
					}
				})
				.finally(() => {
					isHeartbeatPending = false;
				});
		}, ProcessingSweep.HEARTBEAT_INTERVAL_MS);

		return heartbeatInterval;
	}

	private async updateHeartbeat(
		{ status }: DocumentJob,
		{ attempt, documentId }: ProcessingAttempt,
	): Promise<boolean> {
		try {
			return await this.documentRepository.touchProcessingAttempt({
				expectedStatus: status,
				id: documentId,
				processingAttempt: attempt,
			});
		} catch (error) {
			this.logger.error("Failed to update document processing heartbeat.", {
				attempt,
				documentId,
				error,
				status,
			});

			return true;
		}
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
