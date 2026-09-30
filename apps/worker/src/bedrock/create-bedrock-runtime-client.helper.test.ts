import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer, type Server } from "node:http";
import { type AddressInfo } from "node:net";
import { afterEach, describe, it } from "node:test";

import { isTransientExtractionError } from "~/modules/knowledge-extraction/libs/helpers/is-transient-extraction-error.helper.js";

import { createBedrockRuntimeClient } from "./create-bedrock-runtime-client.helper.js";

const LOCAL_HOST = "127.0.0.1";
const RANDOM_PORT = 0;
const REGION = "eu-west-3";
const SHORT_TIMEOUT_MS = 100;
const SINGLE_ATTEMPT = 1;
const HTTP_OK = 200;
const ANSWERED_REQUEST_COUNT = 1;
const EMPTY_ANSWERS = 0;

const createCommand = (): InvokeModelCommand =>
	new InvokeModelCommand({
		body: "{}",
		contentType: "application/json",
		modelId: "test-model",
	});

const isRetryableTimeout = (error: unknown): boolean => {
	assert.ok(error instanceof Error);
	assert.equal(error.name, "TimeoutError");
	assert.equal(isTransientExtractionError(error), true);

	return true;
};

void describe("createBedrockRuntimeClient", () => {
	let server: Server | undefined;

	const startServer = async (answeredRequests: number): Promise<string> => {
		let requestCount = 0;
		server = createServer((_request, response) => {
			requestCount++;

			if (requestCount <= answeredRequests) {
				response.writeHead(HTTP_OK, { "content-type": "application/json" });
				response.end("{}");
			}
		});
		server.listen(RANDOM_PORT, LOCAL_HOST);
		await once(server, "listening");
		const { port } = server.address() as AddressInfo;

		return `http://${LOCAL_HOST}:${String(port)}`;
	};

	const createClient = (
		endpoint: string,
	): ReturnType<typeof createBedrockRuntimeClient> =>
		createBedrockRuntimeClient({
			credentials: { accessKeyId: "test", secretAccessKey: "test" },
			endpoint,
			maxAttempts: SINGLE_ATTEMPT,
			region: REGION,
			requestTimeout: SHORT_TIMEOUT_MS,
		});

	afterEach(() => {
		server?.closeAllConnections();
		server?.close();
	});

	void it("fails a request that never gets an answer with a retryable timeout", async () => {
		const client = createClient(await startServer(EMPTY_ANSWERS));

		await assert.rejects(client.send(createCommand()), isRetryableTimeout);
		client.destroy();
	});

	void it("fails a request on a reused connection that went silent", async () => {
		const client = createClient(await startServer(ANSWERED_REQUEST_COUNT));

		await client.send(createCommand());
		await assert.rejects(client.send(createCommand()), isRetryableTimeout);
		client.destroy();
	});
});
