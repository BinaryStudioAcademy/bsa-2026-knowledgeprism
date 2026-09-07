import { type UserGetAllResponseDto } from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { normalizeError } from "~/lib/helpers/normalize-error.helper.js";
import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { name as sliceName } from "./users.slice.js";

const loadAll = createAsyncThunk<
	UserGetAllResponseDto,
	undefined,
	AsyncThunkConfig
>(
	`${sliceName}/load-all`,
	(_, { extra }) => {
		const { userApi } = extra;

		return userApi.getAll();
	},
	{ serializeError: normalizeError },
);

export { loadAll };
