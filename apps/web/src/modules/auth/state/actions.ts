import {
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { normalizeError } from "~/lib/helpers/normalize-error.helper.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { name as sliceName } from "./auth.slice.js";

const signUp = createAsyncThunk<
	UserSignUpResponseDto,
	UserSignUpRequestDto,
	AsyncThunkConfig
>(
	`${sliceName}/sign-up`,
	(registerPayload, { extra }) => {
		const { authApi } = extra;

		return authApi.signUp(registerPayload);
	},
	{ serializeError: normalizeError },
);

export { signUp };
