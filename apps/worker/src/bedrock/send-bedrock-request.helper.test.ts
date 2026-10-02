import {
	type BedrockRuntimeClient,
	InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { config } from "~/config/config.js";

import { sendBedrockRequest } from "./send-bedrock-request.helper.js";

const ADDITIONAL_REQUEST_COUNT = 2;
const EXPECTED_CALL_COUNT = 2;
const FIRST_CALL = 1;
const NO_ACTIVE_REQUESTS = 0;

void describe("sendBedrockRequest", () => {
	void it("limits concurrent Bedrock requests", async () => {
		const maximumConcurrentRequests =
			config.ENV.AWS.BEDROCK_MAXIMUM_CONCURRENT_REQUESTS;
		const requestCount = maximumConcurrentRequests + ADDITIONAL_REQUEST_COUNT;

		let activeRequests = NO_ACTIVE_REQUESTS;
		let maximumActiveRequests = NO_ACTIVE_REQUESTS;

		const { promise: requestGate, resolve: releaseRequests } =
			Promise.withResolvers<undefined>();

		const client = {
			send: async () => {
				activeRequests++;
				maximumActiveRequests = Math.max(maximumActiveRequests, activeRequests);

				await requestGate;

				activeRequests--;

				return {};
			},
		} as unknown as BedrockRuntimeClient;

		const commands = Array.from(
			{ length: requestCount },
			() => new InvokeModelCommand({ modelId: "test-model" }),
		);

		const requests = commands.map((command) =>
			sendBedrockRequest(command, client),
		);

		await new Promise<void>((resolve) => {
			setImmediate(resolve);
		});

		assert.equal(activeRequests, maximumConcurrentRequests);

		releaseRequests(undefined);

		await Promise.all(requests);

		assert.equal(maximumActiveRequests, maximumConcurrentRequests);
		assert.equal(activeRequests, NO_ACTIVE_REQUESTS);
	});

	void it("releases a slot when a Bedrock request fails", async () => {
		let callCount = 0;

		const client = {
			send: () => {
				callCount++;

				if (callCount === FIRST_CALL) {
					return Promise.reject(new Error("Bedrock request failed"));
				}

				return Promise.resolve({});
			},
		} as unknown as BedrockRuntimeClient;

		const command = new InvokeModelCommand({ modelId: "test-model" });

		await assert.rejects(
			sendBedrockRequest(command, client),
			/Bedrock request failed/,
		);

		await sendBedrockRequest(command, client);

		assert.equal(callCount, EXPECTED_CALL_COUNT);
	});
});
