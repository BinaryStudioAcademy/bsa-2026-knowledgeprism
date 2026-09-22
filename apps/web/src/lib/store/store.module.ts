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
import {
	askPrismApi,
	reducer as askPrismReducer,
} from "~/modules/ask-prism/ask-prism.js";
import { authApi, reducer as authReducer } from "~/modules/auth/auth.js";
import {
	documentsApi,
	reducer as knowledgeReducer,
} from "~/modules/knowledge/knowledge.js";
import {
	projectsApi,
	reducer as projectsReducer,
} from "~/modules/projects/projects.js";
import { userApi, reducer as usersReducer } from "~/modules/users/users.js";
import { workspacesReducer } from "~/modules/workspaces/state/workspaces.slice.js";
import { workspacesApi } from "~/modules/workspaces/workspaces.js";

import { errorMiddleware } from "./error.middleware.js";

type ExtraArguments = {
	askPrismApi: typeof askPrismApi;
	authApi: typeof authApi;
	documentsApi: typeof documentsApi;
	projectsApi: typeof projectsApi;
	storage: typeof storage;
	userApi: typeof userApi;
	workspacesApi: typeof workspacesApi;
};

type RootReducer = {
	askPrism: ReturnType<typeof askPrismReducer>;
	auth: ReturnType<typeof authReducer>;
	knowledge: ReturnType<typeof knowledgeReducer>;
	projects: ReturnType<typeof projectsReducer>;
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
				}).concat(errorMiddleware);
			},
			reducer: {
				askPrism: askPrismReducer,
				auth: authReducer,
				knowledge: knowledgeReducer,
				projects: projectsReducer,
				users: usersReducer,
				workspaces: workspacesReducer,
			},
		});
	}

	public get extraArguments(): ExtraArguments {
		return {
			askPrismApi,
			authApi,
			documentsApi,
			projectsApi,
			storage,
			userApi,
			workspacesApi,
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
