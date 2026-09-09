import { config as loadEnvironment } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Config, type EnvironmentSchema } from "./libs/types/types.js";

const AWS_REGION_REQUIRED_MESSAGE = "AWS_REGION is required";

const ENV_FILE_PATH = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../.env",
);

class BaseConfig implements Config {
	public ENV: EnvironmentSchema;

	public constructor() {
		loadEnvironment({ path: ENV_FILE_PATH });

		const region = process.env["AWS_REGION"];

		if (!region) {
			throw new Error(AWS_REGION_REQUIRED_MESSAGE);
		}

		this.ENV = {
			AWS: {
				REGION: region,
			},
		};
	}
}

export { BaseConfig };
