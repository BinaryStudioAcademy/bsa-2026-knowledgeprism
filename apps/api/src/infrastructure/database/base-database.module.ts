import knex, { type Knex } from "knex";
import { knexSnakeCaseMappers, Model, type Transaction } from "objection";

import { type Config } from "~/infrastructure/config/config.js";
import { type Logger } from "~/infrastructure/logger/logger.js";
import { AppEnvironment } from "~/shared/enums/enums.js";

import { DatabaseTableName } from "./libs/enums/enums.js";
import { type Database } from "./libs/types/types.js";

class BaseDatabase implements Database {
	private appConfig: Config;

	private logger: Logger;

	public constructor(config: Config, logger: Logger) {
		this.appConfig = config;
		this.logger = logger;
	}

	private get environmentConfig(): Knex.Config {
		return this.environmentsConfig[this.appConfig.ENV.APP.ENVIRONMENT];
	}

	private get initialConfig(): Knex.Config {
		return {
			client: this.appConfig.ENV.DB.DIALECT,
			connection: this.appConfig.ENV.DB.CONNECTION_STRING,
			debug: false,
			migrations: {
				directory: "src/infrastructure/database/migrations",
				tableName: DatabaseTableName.MIGRATIONS,
			},
			pool: {
				max: this.appConfig.ENV.DB.POOL_MAX,
				min: this.appConfig.ENV.DB.POOL_MIN,
			},
			...knexSnakeCaseMappers({ underscoreBetweenUppercaseLetters: true }),
		};
	}

	public get environmentsConfig(): Database["environmentsConfig"] {
		return {
			[AppEnvironment.DEVELOPMENT]: this.initialConfig,
			[AppEnvironment.PRODUCTION]: this.initialConfig,
		};
	}

	public connect(): ReturnType<Database["connect"]> {
		this.logger.info("Establish DB connection...");

		Model.knex(knex.default(this.environmentConfig));
	}

	public transaction<T>(
		handler: (transaction: Transaction) => Promise<T>,
	): Promise<T> {
		return Model.transaction(handler);
	}
}

export { BaseDatabase };
