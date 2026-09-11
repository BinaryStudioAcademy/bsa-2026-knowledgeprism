import {
	type AsyncThunk,
	type AsyncThunkOptions,
	type AsyncThunkPayloadCreator,
	type ThunkMiddleware,
	type Tuple,
	type UnknownAction,
} from "@reduxjs/toolkit";
import {
	configureStore,
	createAsyncThunk as createReduxAsyncThunk,
} from "@reduxjs/toolkit";

import { type Config } from "~/lib/config/config.js";
import { AppEnvironment } from "~/lib/enums/enums.js";
import { serializeError } from "~/lib/helpers/serialize-error.helper.js";
import { storage } from "~/lib/storage/storage.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";
import { authApi, reducer as authReducer } from "~/modules/auth/auth.js";
import { userApi, reducer as usersReducer } from "~/modules/users/users.js";

import { errorMiddleware } from "./error.middleware.js";

type ExtraArguments = {
	authApi: typeof authApi;
	storage: typeof storage;
	userApi: typeof userApi;
};

type RootReducer = {
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
				}).concat(errorMiddleware);
			},
			reducer: {
				auth: authReducer,
				users: usersReducer,
			},
		});
	}

	public get extraArguments(): ExtraArguments {
		return {
			authApi,
			storage,
			userApi,
		};
	}
}

function createAppAsyncThunk<Returned, ThunkArgument = void>(
	typePrefix: string,
	payloadCreator: AsyncThunkPayloadCreator<
		Returned,
		ThunkArgument,
		AsyncThunkConfig
	>,
	options?: Omit<
		AsyncThunkOptions<ThunkArgument, AsyncThunkConfig>,
		"serializeError"
	>,
): AsyncThunk<Returned, ThunkArgument, AsyncThunkConfig> {
	return createReduxAsyncThunk<Returned, ThunkArgument, AsyncThunkConfig>(
		typePrefix,
		payloadCreator,
		{
			...options,
			serializeError,
		},
	);
}

export { createAppAsyncThunk, Store };
