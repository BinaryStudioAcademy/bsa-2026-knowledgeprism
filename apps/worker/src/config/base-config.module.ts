import { config as loadEnvironment } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Config } from "./libs/types/config.type.js";
import { type EnvironmentSchema } from "./libs/types/environment-schema.type.js";

const ENV_FILE_PATH = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../.env",
);

const MINIMUM_POSITIVE_INTEGER = 1;
const DEFAULT_BEDROCK_MAXIMUM_CONCURRENT_REQUESTS = 4;

const readRequiredEnvironmentVariable = (name: string): string => {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required`);
	}

	return value;
};

const readPositiveIntegerEnvironmentVariable = (
	name: string,
	defaultValue: number,
): number => {
	if (!process.env[name]) {
		return defaultValue;
	}

	const value = Number(process.env[name]);

	if (!Number.isSafeInteger(value) || value < MINIMUM_POSITIVE_INTEGER) {
		throw new Error(`${name} must be a positive integer`);
	}

	return value;
};

class BaseConfig implements Config {
	public ENV: EnvironmentSchema;

	public constructor() {
		loadEnvironment({ path: ENV_FILE_PATH });

		this.ENV = {
			AWS: {
				BEDROCK_MAXIMUM_CONCURRENT_REQUESTS:
					readPositiveIntegerEnvironmentVariable(
						"BEDROCK_MAXIMUM_CONCURRENT_REQUESTS",
						DEFAULT_BEDROCK_MAXIMUM_CONCURRENT_REQUESTS,
					),
				REGION: readRequiredEnvironmentVariable("AWS_REGION"),
				S3_BUCKET_NAME: readRequiredEnvironmentVariable("AWS_S3_BUCKET_NAME"),
			},
		};
	}
}

export { BaseConfig };
