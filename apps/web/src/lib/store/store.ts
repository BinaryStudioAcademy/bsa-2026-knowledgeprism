import { config } from "~/lib/config/config.js";

import { Store } from "./store.module.js";

const store = new Store(config);

export { store };
