import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

import { config } from "~/infrastructure/config/config.js";

const bedrockRuntimeClient = new BedrockRuntimeClient({
	region: config.ENV.AWS.REGION,
});

export { bedrockRuntimeClient };
