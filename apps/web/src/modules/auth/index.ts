import { config } from "~/lib/config/config.js";
import { http } from "~/lib/http/http.js";
import { storage } from "~/lib/storage/storage.js";

import { AuthApi } from "./api/auth-api.js";

const authApi = new AuthApi({
	baseUrl: config.ENV.API.ORIGIN_URL,
	http,
	storage,
});

export { authApi };

export { actions, reducer } from "./state/state.js";
