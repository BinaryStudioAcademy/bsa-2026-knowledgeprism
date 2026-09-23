import { SQSClient } from "@aws-sdk/client-sqs";

import { config } from "~/infrastructure/config/config.js";

const sqsClient = new SQSClient({
	region: config.ENV.AWS.REGION,
});

export { sqsClient };
