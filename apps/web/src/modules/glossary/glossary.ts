import { config } from "~/lib/config/config.js";
import { http } from "~/lib/http/http.js";
import { storage } from "~/lib/storage/storage.js";

import { GlossaryApi } from "./api/glossary-api.js";

const glossaryApi = new GlossaryApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
	http,
	storage,
});

export { glossaryApi };
export { GlossaryPage } from "./components/components.js";
export { reducer } from "./state/state.js";
