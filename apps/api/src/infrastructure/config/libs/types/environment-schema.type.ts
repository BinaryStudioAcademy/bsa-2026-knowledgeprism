import { type AppEnvironment } from "~/shared/enums/enums.js";
import { type ValueOf } from "~/shared/types/types.js";

type EnvironmentSchema = {
	APP: {
		ENVIRONMENT: ValueOf<typeof AppEnvironment>;
		HOST: string;
		PORT: number;
	};
	AWS: {
		REGION: string;
	};
	DB: {
		CONNECTION_STRING: string;
		DIALECT: string;
		POOL_MAX: number;
		POOL_MIN: number;
	};
	SESSION: {
		SECRET: string;
	};
};

export { type EnvironmentSchema };
