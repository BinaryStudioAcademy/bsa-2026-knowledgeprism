import {
	BedrockRuntimeClient,
	type BedrockRuntimeClientConfig,
} from "@aws-sdk/client-bedrock-runtime";
import { NodeHttpHandler } from "@smithy/node-http-handler";

import { BedrockTimeout } from "./bedrock-timeout.constant.js";

type BedrockClientOptions = Omit<
	BedrockRuntimeClientConfig,
	"requestHandler"
> & {
	requestTimeout?: number;
};

const createBedrockRuntimeClient = ({
	requestTimeout = BedrockTimeout.REQUEST_MS,
	...options
}: BedrockClientOptions): BedrockRuntimeClient =>
	new BedrockRuntimeClient({
		...options,
		requestHandler: new NodeHttpHandler({
			connectionTimeout: BedrockTimeout.CONNECTION_MS,
			requestTimeout,
			throwOnRequestTimeout: true,
		}),
	});

export { createBedrockRuntimeClient };
