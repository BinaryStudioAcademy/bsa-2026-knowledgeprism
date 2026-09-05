import convict, { type Config as LibraryConfig } from "convict";
import { config } from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { type Logger } from "~/infrastructure/logger/logger.js";
import { AppEnvironment } from "~/shared/enums/enums.js";

import { type Config, type EnvironmentSchema } from "./libs/types/types.js";

const ENV_FILE_PATH = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"../../../.env",
);

class BaseConfig implements Config {
	private logger: Logger;

	public ENV: EnvironmentSchema;

	public constructor(logger: Logger) {
		this.logger = logger;

		config({ path: ENV_FILE_PATH });

		this.envSchema.load({});
		this.envSchema.validate({
			allowed: "strict",
			output: (message) => {
				this.logger.info(message);
			},
		});

		this.ENV = this.envSchema.getProperties();
		this.logger.info(".env file found and successfully parsed!");
	}

	private get envSchema(): LibraryConfig<EnvironmentSchema> {
		return convict<EnvironmentSchema>({
			APP: {
				ENVIRONMENT: {
					default: null,
					doc: "Application environment",
					env: "NODE_ENV",
					format: Object.values(AppEnvironment),
				},
				HOST: {
					default: null,
					doc: "Host for server app",
					env: "HOST",
					format: String,
				},
				PORT: {
					default: null,
					doc: "Port for incoming connections",
					env: "PORT",
					format: Number,
				},
			},
			AWS: {
				REGION: {
					default: null,
					doc: "AWS region for Bedrock Runtime",
					env: "AWS_REGION",
					format: String,
				},
				S3_BUCKET_NAME: {
					default: null,
					doc: "AWS S3 bucket name for document storage",
					env: "AWS_S3_BUCKET_NAME",
					format: String,
				},
			},
			DB: {
				CONNECTION_STRING: {
					default: null,
					doc: "Database connection string",
					env: "DB_CONNECTION_STRING",
					format: String,
				},
				DIALECT: {
					default: null,
					doc: "Database dialect",
					env: "DB_DIALECT",
					format: String,
				},
				POOL_MAX: {
					default: null,
					doc: "Database pool max count",
					env: "DB_POOL_MAX",
					format: Number,
				},
				POOL_MIN: {
					default: null,
					doc: "Database pool min count",
					env: "DB_POOL_MIN",
					format: Number,
				},
			},
		});
	}
}

export { BaseConfig };
