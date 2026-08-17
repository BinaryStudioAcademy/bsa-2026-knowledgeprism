import { type Config as LibraryConfig } from "@knowledgeprism/config";

import { EnvironmentSchema } from "./types.js";

type Config = LibraryConfig<EnvironmentSchema>;

export { type Config };
