import { config } from "~/lib/config/config.js";
import { http } from "~/lib/http/http.js";
import { storage } from "~/lib/storage/storage.js";

import { AskPrismApi } from "./api/ask-prism-api.js";

const askPrismApi = new AskPrismApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
	http,
	storage,
});

export { askPrismApi };
export { AskPrismView } from "./components/components.js";
export { reducer } from "./state/state.js";
