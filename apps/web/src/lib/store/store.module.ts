import {
	type ThunkMiddleware,
	type Tuple,
	type UnknownAction,
} from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";

import { type Config } from "~/lib/config/config.js";
import { AppEnvironment } from "~/lib/enums/enums.js";
import { storage } from "~/lib/storage/storage.js";
import { authApi, reducer as authReducer } from "~/modules/auth/auth.js";
import { userApi, reducer as usersReducer } from "~/modules/users/users.js";
import { workspacesReducer } from "~/modules/workspaces/state/workspaces.slice.js";
import { workspacesApi } from "~/modules/workspaces/workspaces.js";

type ExtraArguments = {
	authApi: typeof authApi;
	storage: typeof storage;
	userApi: typeof userApi;
	workspacesApi: typeof workspacesApi;
};

type RootReducer = {
	auth: ReturnType<typeof authReducer>;
	users: ReturnType<typeof usersReducer>;
	workspaces: ReturnType<typeof workspacesReducer>;
};

class Store {
	public instance: ReturnType<
		typeof configureStore<
			RootReducer,
			UnknownAction,
			Tuple<[ThunkMiddleware<RootReducer, UnknownAction, ExtraArguments>]>
		>
	>;

	public constructor(config: Config) {
		this.instance = configureStore({
			devTools: config.ENV.APP.ENVIRONMENT !== AppEnvironment.PRODUCTION,
			middleware: (getDefaultMiddleware) => {
				return getDefaultMiddleware({
					thunk: {
						extraArgument: this.extraArguments,
					},
				});
			},
			reducer: {
				auth: authReducer,
				users: usersReducer,
				workspaces: workspacesReducer,
			},
		});
	}

	public get extraArguments(): ExtraArguments {
		return {
			authApi,
			storage,
			userApi,
			workspacesApi,
		};
	}
}

export { Store };
