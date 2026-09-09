import { BedrockRuntimeClient } from "@aws-sdk/client-bedrock-runtime";

import { config } from "~/config/config.js";

const bedrockRuntimeClient = new BedrockRuntimeClient({
	region: config.ENV.AWS.REGION,
});

export { bedrockRuntimeClient };
