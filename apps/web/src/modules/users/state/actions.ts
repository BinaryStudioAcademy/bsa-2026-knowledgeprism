import { type UserGetAllResponseDto } from "@knowledgeprism/types";

import { createAppAsyncThunk } from "~/lib/store/store.module.js";

import { name as sliceName } from "./users.slice.js";

const loadAll = createAppAsyncThunk<UserGetAllResponseDto, undefined>(
	`${sliceName}/load-all`,
	(_, { extra }) => {
		const { userApi } = extra;

		return userApi.getAll();
	},
);

export { loadAll };
