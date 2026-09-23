import { SendMessageCommand } from "@aws-sdk/client-sqs";
import { type DocumentProcessingJobDto } from "@knowledgeprism/types";

import { config } from "~/infrastructure/config/config.js";
import { sqsClient } from "~/infrastructure/sqs/sqs.js";

type SendDocumentProcessingJob = (
	job: DocumentProcessingJobDto,
) => Promise<void>;

const sendDocumentProcessingJob: SendDocumentProcessingJob = async (job) => {
	await sqsClient.send(
		new SendMessageCommand({
			MessageBody: JSON.stringify(job),
			QueueUrl: config.ENV.AWS.SQS_QUEUE_URL,
		}),
	);
};

export { type SendDocumentProcessingJob, sendDocumentProcessingJob };
