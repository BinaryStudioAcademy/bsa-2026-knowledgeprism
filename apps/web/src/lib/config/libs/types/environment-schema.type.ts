import { AppEnvironment } from "~/lib/enums/enums.js";
import { ValueOf } from "~/lib/types/types.js";

type EnvironmentSchema = {
	API: {
		ORIGIN_URL: string;
	};
	APP: {
		ENVIRONMENT: ValueOf<typeof AppEnvironment>;
	};
};

export { type EnvironmentSchema };
