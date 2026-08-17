import { type UserGetAllResponseDto } from "@knowledgeprism/types";
import { createAsyncThunk } from "@reduxjs/toolkit";

import { type AsyncThunkConfig } from "~/lib/types/types.js";

import { name as sliceName } from "./users.slice.js";

const loadAll = createAsyncThunk<
	UserGetAllResponseDto,
	undefined,
	AsyncThunkConfig
>(`${sliceName}/load-all`, (_, { extra }) => {
	const { userApi } = extra;

	return userApi.getAll();
});

export { loadAll };
