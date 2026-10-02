import { config } from "~/config/config.js";

import { createBedrockRuntimeClient } from "./create-bedrock-runtime-client.helper.js";

const bedrockRuntimeClient = createBedrockRuntimeClient({
	region: config.ENV.AWS.REGION,
});

export { bedrockRuntimeClient };
