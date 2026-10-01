import "~/test-setup.js";

import { type S3Client } from "@aws-sdk/client-s3";
import { type FastifyReply, type FastifyRequest } from "fastify";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { type Config } from "~/infrastructure/config/libs/types/config.type.js";
import { type Database } from "~/infrastructure/database/database.js";
import { type Health, HealthStatus } from "~/infrastructure/health/health.js";
import { HTTPCode } from "~/infrastructure/http/http.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { ServerErrorType } from "~/shared/enums/enums.js";
import { type ValueOf } from "~/shared/types/types.js";

import { BaseServerApplication } from "./base-server-application.js";
import { SERVER_BODY_LIMIT_IN_BYTES } from "./libs/constants/server-body-limit.constant.js";
import { type ServerApplicationRouteParameters } from "./libs/types/types.js";

const TEST_PORT = 3000;
const TWO_MEGABYTES = 2_097_152;

const createMockDependencies = (): {
	config: Config;
	database: Database;
	health: Health;
	logger: Logger;
	s3Client: S3Client;
} => {
	const logger = {
		debug: (): void => {},
		error: (): void => {},
		info: (): void => {},
		warn: (): void => {},
	} as unknown as Logger;

	const config = {
		ENV: {
			APP: {
				ENVIRONMENT: "test",
				HOST: "127.0.0.1",
				PORT: TEST_PORT,
			},
			SESSION: {
				SECRET: "test-secret-at-least-32-chars-long!",
			},
		},
	} as unknown as Config;

	const database = {
		client: {},
		connect: (): void => {},
	} as unknown as Database;

	const health = {
		getHealthStatus: (): Promise<{ status: ValueOf<typeof HealthStatus> }> =>
			Promise.resolve({
				status: HealthStatus.OK,
			}),
	} as unknown as Health;

	const s3Client = {} as unknown as S3Client;

	return { config, database, health, logger, s3Client };
};

void describe("BaseServerApplication body limit and error handling", () => {
	void it("accepts request payloads larger than default 1MB", async () => {
		const dependencies = createMockDependencies();
		const server = new BaseServerApplication({
			...dependencies,
			apis: [],
			title: "Test API",
		});

		const routeParameters: ServerApplicationRouteParameters = {
			handler: async (
				request: FastifyRequest,
				reply: FastifyReply,
			): Promise<void> => {
				const body = request.body as { data: string };

				await reply.status(HTTPCode.OK).send({
					dataLength: body.data.length,
				});
			},
			method: "POST",
			path: "/test-large-body",
		};

		server.addRoute(routeParameters);

		const largePayload = JSON.stringify({
			data: "x".repeat(TWO_MEGABYTES),
		});

		const response = await server.fastify.inject({
			headers: {
				"content-type": "application/json",
			},
			method: "POST",
			payload: largePayload,
			url: "/test-large-body",
		});

		assert.strictEqual(response.statusCode, HTTPCode.OK);
		const json = JSON.parse(response.body) as { dataLength: number };
		assert.strictEqual(json.dataLength, TWO_MEGABYTES);
	});

	void it("returns JSON 404 response for unmatched /api routes", async () => {
		const dependencies = createMockDependencies();
		const server = new BaseServerApplication({
			...dependencies,
			apis: [],
			title: "Test API",
		});

		const existingRouteParameters: ServerApplicationRouteParameters = {
			handler: async (
				_request: FastifyRequest,
				reply: FastifyReply,
			): Promise<void> => {
				await reply.status(HTTPCode.OK).send({ ok: true });
			},
			method: "GET",
			path: "/api/v1/existing",
		};

		server.addRoute(existingRouteParameters);

		const response = await server.fastify.inject({
			method: "GET",
			url: "/api/v1/non-existent-route",
		});

		assert.strictEqual(response.statusCode, HTTPCode.NOT_FOUND);
		assert.ok(response.headers["content-type"]?.includes("application/json"));
		const json = JSON.parse(response.body) as {
			errorType: string;
			message: string;
		};
		assert.strictEqual(json.errorType, ServerErrorType.COMMON);
		assert.strictEqual(json.message, "API route not found.");
	});

	void it("configures body limit up to SERVER_BODY_LIMIT_IN_BYTES", () => {
		const dependencies = createMockDependencies();
		const server = new BaseServerApplication({
			...dependencies,
			apis: [],
			title: "Test API",
		});

		assert.strictEqual(
			server.fastify.initialConfig.bodyLimit,
			SERVER_BODY_LIMIT_IN_BYTES,
		);
	});
});
