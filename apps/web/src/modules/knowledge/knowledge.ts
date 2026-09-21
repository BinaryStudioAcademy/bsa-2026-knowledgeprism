import { config } from "~/lib/config/config.js";
import { http } from "~/lib/http/http.js";
import { storage } from "~/lib/storage/storage.js";

import { DocumentsApi } from "./api/documents-api.js";

const documentsApi = new DocumentsApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
	http,
	storage,
});

export { documentsApi };
export { actions, reducer } from "./state/state.js";
