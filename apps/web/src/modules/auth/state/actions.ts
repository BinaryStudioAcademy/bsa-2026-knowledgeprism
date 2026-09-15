import {
	type UserGetCurrentResponseDto,
	type UserSignInRequestDto,
	type UserSignInResponseDto,
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { name as sliceName } from "./auth.slice.js";

const getCurrentUser = createAsyncThunk<
	null | UserGetCurrentResponseDto,
	undefined,
	AsyncThunkConfig
>(`${sliceName}/get-current-user`, (_payload, { extra }) => {
	const { authApi } = extra;

	return authApi.getCurrentUser();
});

const signIn = createAsyncThunk<
	UserSignInResponseDto,
	UserSignInRequestDto,
	AsyncThunkConfig
>(`${sliceName}/sign-in`, (loginPayload, { extra }) => {
	const { authApi } = extra;

	return authApi.signIn(loginPayload);
});

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
		const { authApi } = extra;

		await authApi.logout();

		return null;
	},
);

export { getCurrentUser, logout, signIn, signUp };
