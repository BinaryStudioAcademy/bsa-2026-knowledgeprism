import { config } from "~/config/config.js";

import { createBedrockRuntimeClient } from "./create-bedrock-runtime-client.helper.js";

const { BEDROCK_ACCESS_KEY_ID, BEDROCK_SECRET_ACCESS_KEY, REGION } =
	config.ENV.AWS;

const bedrockRuntimeClient = createBedrockRuntimeClient({
	...(BEDROCK_ACCESS_KEY_ID &&
		BEDROCK_SECRET_ACCESS_KEY && {
			credentials: {
				accessKeyId: BEDROCK_ACCESS_KEY_ID,
				secretAccessKey: BEDROCK_SECRET_ACCESS_KEY,
			},
		}),
	region: REGION,
});

export { bedrockRuntimeClient };
