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

const readOptionalEnvironmentVariable = (name: string): null | string => {
	return process.env[name] || null;
};

class BaseConfig implements Config {
	public ENV: EnvironmentSchema;

	public constructor() {
		loadEnvironment({ path: ENV_FILE_PATH });

		this.ENV = {
			AWS: {
				BEDROCK_ACCESS_KEY_ID: readOptionalEnvironmentVariable(
					"BEDROCK_ACCESS_KEY_ID",
				),
				BEDROCK_SECRET_ACCESS_KEY: readOptionalEnvironmentVariable(
					"BEDROCK_SECRET_ACCESS_KEY",
				),
				REGION: readRequiredEnvironmentVariable("AWS_REGION"),
				S3_BUCKET_NAME: readRequiredEnvironmentVariable("AWS_S3_BUCKET_NAME"),
			},
		};
	}
}

export { BaseConfig };
