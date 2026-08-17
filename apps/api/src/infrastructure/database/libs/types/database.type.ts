import { type Knex } from "knex";

import { type AppEnvironment } from "~/shared/enums/enums.js";
import { type ValueOf } from "~/shared/types/types.js";

type Database = {
	connect: () => void;
	environmentsConfig: Record<ValueOf<typeof AppEnvironment>, Knex.Config>;
};

export { type Database };
