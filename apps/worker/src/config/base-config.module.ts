import { config as loadEnvironment } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Config } from "./libs/types/config.type.js";
import { type EnvironmentSchema } from "./libs/types/environment-schema.type.js";

const ENV_FILE_PATH = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../.env",
);

const readRequiredEnvironmentVariable = (name: string): string => {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required`);
	}

	return value;
};

const readRequiredNumberEnvironmentVariable = (name: string): number => {
	const value = Number(readRequiredEnvironmentVariable(name));

	if (!Number.isSafeInteger(value) || value <= Number.EPSILON) {
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
					readRequiredNumberEnvironmentVariable(
						"BEDROCK_MAXIMUM_CONCURRENT_REQUESTS",
					),
				REGION: readRequiredEnvironmentVariable("AWS_REGION"),
				S3_BUCKET_NAME: readRequiredEnvironmentVariable("AWS_S3_BUCKET_NAME"),
			},
		};
	}
}

export { BaseConfig };
