import {
	type UserGetCurrentResponseDto,
	type UserSignInRequestDto,
	type UserSignInResponseDto,
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";

import { StorageKey } from "~/lib/storage/storage.js";
import { createAppAsyncThunk } from "~/lib/store/store.module.js";

import { name as sliceName } from "./auth.slice.js";

const signIn = createAppAsyncThunk<UserSignInResponseDto, UserSignInRequestDto>(
	`${sliceName}/sign-in`,
	async (loginPayload, { extra }) => {
		const { authApi, storage } = extra;

		const response = await authApi.signIn(loginPayload);

		try {
			await storage.set(StorageKey.LOGGED_IN_HINT, "true");
		} catch {
			// Ignore
		}

		return response;
	},
);

const signUp = createAppAsyncThunk<UserSignUpResponseDto, UserSignUpRequestDto>(
	`${sliceName}/sign-up`,
	async (registerPayload, { extra }) => {
		const { authApi, storage } = extra;

		const response = await authApi.signUp(registerPayload);

		try {
			await storage.set(StorageKey.LOGGED_IN_HINT, "true");
		} catch {
			// Ignore
		}

		return response;
	},
);

const logout = createAppAsyncThunk<null, undefined>(
	`${sliceName}/logout`,
	async (_, { extra }) => {
		const { authApi, storage } = extra;

		await authApi.logout();

		try {
			await storage.drop(StorageKey.LOGGED_IN_HINT);
		} catch {
			// Ignore
		}

		return null;
	},
);

const loadCurrentUser = createAppAsyncThunk<
	UserGetCurrentResponseDto,
	undefined
>(`${sliceName}/load-current-user`, async (_, { extra }) => {
	const { authApi, storage } = extra;

	try {
		const response = await authApi.getCurrentUser();

		try {
			await storage.set(StorageKey.LOGGED_IN_HINT, "true");
		} catch {
			// Ignore
		}

		return response;
	} catch (error) {
		try {
			await storage.drop(StorageKey.LOGGED_IN_HINT);
		} catch {
			// Ignore
		}

		throw error;
	}
});

export { loadCurrentUser, logout, signIn, signUp };
