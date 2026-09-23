import { config } from "~/lib/config/config.js";
import { http } from "~/lib/http/http.js";
import { storage } from "~/lib/storage/storage.js";

import { DocumentsApi } from "./api/documents-api.js";
import { KnowledgeApi } from "./api/knowledge-api.js";

const documentsApi = new DocumentsApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
	http,
	storage,
});

const knowledgeApi = new KnowledgeApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
	http,
	storage,
});

export { documentsApi, knowledgeApi };
export { actions, reducer } from "./state/state.js";
