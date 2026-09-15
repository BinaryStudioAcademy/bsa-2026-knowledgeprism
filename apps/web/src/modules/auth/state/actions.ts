import {
	type UserSignInRequestDto,
	type UserSignInResponseDto,
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";

import { createAppAsyncThunk } from "~/lib/store/store.module.js";

import { name as sliceName } from "./auth.slice.js";

const signIn = createAppAsyncThunk<UserSignInResponseDto, UserSignInRequestDto>(
	`${sliceName}/sign-in`,
	(loginPayload, { extra }) => {
		const { authApi } = extra;

		return authApi.signIn(loginPayload);
	},
);

const signUp = createAppAsyncThunk<UserSignUpResponseDto, UserSignUpRequestDto>(
	`${sliceName}/sign-up`,
	(registerPayload, { extra }) => {
		const { authApi } = extra;

		return authApi.signUp(registerPayload);
	},
);

const logout = createAppAsyncThunk<null, undefined>(
	`${sliceName}/logout`,
	async (_, { extra }) => {
		const { authApi } = extra;

		await authApi.logout();

		return null;
	},
);

export { logout, signIn, signUp };
