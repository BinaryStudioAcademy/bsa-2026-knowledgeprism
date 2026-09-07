import { config } from "~/lib/config/config.js";

import { Store } from "./store.module.js";

const store = new Store(config);

type AppDispatch = typeof store.instance.dispatch;
type RootState = ReturnType<typeof store.instance.getState>;

export { type AppDispatch, type RootState, store };
