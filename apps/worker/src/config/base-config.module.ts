import { config as loadEnvironment } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Config, type EnvironmentSchema } from "./libs/types/types.js";

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

class BaseConfig implements Config {
	public ENV: EnvironmentSchema;

	public constructor() {
		loadEnvironment({ path: ENV_FILE_PATH });

		this.ENV = {
			AWS: {
				REGION: readRequiredEnvironmentVariable("AWS_REGION"),
				S3_BUCKET_NAME: readRequiredEnvironmentVariable("AWS_S3_BUCKET_NAME"),
			},
		};
	}
}

export { BaseConfig };
