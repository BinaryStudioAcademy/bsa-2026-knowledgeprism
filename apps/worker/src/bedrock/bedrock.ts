import { config } from "~/config/config.js";

import { ExtractionBedrockConfig } from "./bedrock-request.constant.js";
import { createBedrockRuntimeClient } from "./create-bedrock-runtime-client.helper.js";

const { BEDROCK_ACCESS_KEY_ID, BEDROCK_SECRET_ACCESS_KEY, REGION } =
	config.ENV.AWS;

const clientOptions = {
	...(BEDROCK_ACCESS_KEY_ID &&
		BEDROCK_SECRET_ACCESS_KEY && {
			credentials: {
				accessKeyId: BEDROCK_ACCESS_KEY_ID,
				secretAccessKey: BEDROCK_SECRET_ACCESS_KEY,
			},
		}),
	region: REGION,
};

const bedrockRuntimeClient = createBedrockRuntimeClient(clientOptions);

const extractionBedrockRuntimeClient = createBedrockRuntimeClient({
	...clientOptions,
	requestTimeout: ExtractionBedrockConfig.REQUEST_TIMEOUT_MS,
});

export { bedrockRuntimeClient, extractionBedrockRuntimeClient };
