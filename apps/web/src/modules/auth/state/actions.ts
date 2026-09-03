import {
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { StorageKey } from "~/lib/storage/storage.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { name as sliceName } from "./auth.slice.js";

const signUp = createAsyncThunk<
	UserSignUpResponseDto,
	UserSignUpRequestDto,
	AsyncThunkConfig
>(`${sliceName}/sign-up`, (registerPayload, { extra }) => {
	const { authApi } = extra;

	return authApi.signUp(registerPayload);
});

const logout = createAsyncThunk<null, undefined, AsyncThunkConfig>(
	`${sliceName}/logout`,
	async (_, { extra }) => {
		const { storage } = extra;

		await storage.drop(StorageKey.TOKEN);

		return null;
	},
);

export { logout, signUp };
