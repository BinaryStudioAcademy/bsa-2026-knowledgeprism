import type {
	BedrockRuntimeClient,
	InvokeModelCommand,
	InvokeModelCommandOutput,
} from "@aws-sdk/client-bedrock-runtime";

import { config } from "~/config/config.js";

import { bedrockRuntimeClient } from "./bedrock.js";

class BedrockConcurrencyLimiter {
	private activeRequests = Number();

	private readonly maximumConcurrentRequests: number;

	private readonly waitingRequests: (() => void)[] = [];

	public constructor(maximumConcurrentRequests: number) {
		this.maximumConcurrentRequests = maximumConcurrentRequests;
	}

	public async acquire(): Promise<void> {
		if (this.activeRequests < this.maximumConcurrentRequests) {
			this.activeRequests++;
			return;
		}

		await new Promise<void>((resolve) => {
			this.waitingRequests.push(resolve);
		});
	}

	public release(): void {
		const nextRequest = this.waitingRequests.shift();

		if (nextRequest) {
			nextRequest();
			return;
		}

		this.activeRequests--;
	}
}

const bedrockConcurrencyLimiter = new BedrockConcurrencyLimiter(
	config.ENV.AWS.BEDROCK_MAXIMUM_CONCURRENT_REQUESTS,
);

const sendBedrockRequest = async (
	command: InvokeModelCommand,
	client: BedrockRuntimeClient = bedrockRuntimeClient,
): Promise<InvokeModelCommandOutput> => {
	await bedrockConcurrencyLimiter.acquire();

	try {
		return await client.send(command);
	} finally {
		bedrockConcurrencyLimiter.release();
	}
};

export { sendBedrockRequest };
