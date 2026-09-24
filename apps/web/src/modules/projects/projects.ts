import { config } from "~/lib/config/config.js";
import { http } from "~/lib/http/http.js";
import { storage } from "~/lib/storage/storage.js";

import { ProjectsApi } from "./api/projects-api.js";

const projectsApi = new ProjectsApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
	http,
	storage,
});

export { actions, reducer } from "./state/state.js";
export { projectsApi };
