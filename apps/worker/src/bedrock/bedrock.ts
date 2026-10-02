import { config } from "~/config/config.js";

import { createBedrockRuntimeClient } from "./create-bedrock-runtime-client.helper.js";

const { ACCESS_KEY_ID: accessKeyId, SECRET_ACCESS_KEY: secretAccessKey } =
	config.ENV.BEDROCK;

const credentials =
	accessKeyId && secretAccessKey
		? {
				accessKeyId,
				secretAccessKey,
			}
		: undefined;

const bedrockRuntimeClient = createBedrockRuntimeClient({
	...(credentials && { credentials }),
	region: config.ENV.AWS.REGION,
});

export { bedrockRuntimeClient };
