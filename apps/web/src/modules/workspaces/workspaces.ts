import { config } from "~/lib/config/config.js";

import { WorkspacesApi } from "./api/workspaces-api.js";

const workspacesApi = new WorkspacesApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
});

export { workspacesApi };
