import { config } from "~/lib/config/config.js";
import { http } from "~/lib/http/http.js";
import { storage } from "~/lib/storage/storage.js";

import { WorkspacesApi } from "./api/workspaces-api.js";

const workspacesApi = new WorkspacesApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
	http,
	storage,
});

export { workspacesApi };
