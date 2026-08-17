import { type AppEnvironment } from "~/shared/enums/enums.js";
import { type ValueOf } from "~/shared/types/types.js";

type EnvironmentSchema = {
	APP: {
		ENVIRONMENT: ValueOf<typeof AppEnvironment>;
		HOST: string;
		PORT: number;
	};
	DB: {
		CONNECTION_STRING: string;
		DIALECT: string;
		POOL_MAX: number;
		POOL_MIN: number;
	};
};

export { type EnvironmentSchema };
