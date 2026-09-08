import {
	type ThunkMiddleware,
	type Tuple,
	type UnknownAction,
} from "@reduxjs/toolkit";
import { configureStore } from "@reduxjs/toolkit";

import { type Config } from "~/lib/config/config.js";
import { AppEnvironment } from "~/lib/enums/enums.js";
import { storage } from "~/lib/storage/storage.js";

import {
	askPrismApi,
	reducer as askPrismReducer,
} from "~/modules/ask-prism/ask-prism.js";
import { authApi, reducer as authReducer } from "~/modules/auth/auth.js";
import { userApi, reducer as usersReducer } from "~/modules/users/users.js";

type ExtraArguments = {
	askPrismApi: typeof askPrismApi;
	authApi: typeof authApi;
	storage: typeof storage;
	userApi: typeof userApi;
};

type RootReducer = {
	askPrism: ReturnType<typeof askPrismReducer>;
	auth: ReturnType<typeof authReducer>;
	users: ReturnType<typeof usersReducer>;
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
				askPrism: askPrismReducer,
				auth: authReducer,
				users: usersReducer,
			},
		});
	}

	public get extraArguments(): ExtraArguments {
		return {
			askPrismApi,
			authApi,
			storage,
			userApi,
		};
	}
}

export { Store };
