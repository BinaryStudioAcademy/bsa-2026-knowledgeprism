import {
	type UserCreateRequestDto,
	type UserDetailsResponseDto,
	type UserGetAllResponseDto,
	type UserUpdateRequestDto,
} from "@knowledgeprism/types";

import { createAppAsyncThunk } from "~/lib/store/store.module.js";

import { name as sliceName } from "./users.slice.js";

const loadAll = createAppAsyncThunk<UserGetAllResponseDto, undefined>(
	`${sliceName}/load-all`,
	(_, { extra }) => {
		const { userApi } = extra;

		return userApi.getAll();
	},
);

const loadUserById = createAppAsyncThunk<UserDetailsResponseDto, number>(
	`${sliceName}/load-by-id`,
	(id, { extra }) => {
		const { userApi } = extra;

		return userApi.getById(id);
	},
);

const createUser = createAppAsyncThunk<
	UserDetailsResponseDto,
	UserCreateRequestDto
>(`${sliceName}/create`, (payload, { extra }) => {
	const { userApi } = extra;

	return userApi.create(payload);
});

const updateUser = createAppAsyncThunk<
	UserDetailsResponseDto,
	{ id: number; payload: UserUpdateRequestDto }
>(`${sliceName}/update`, ({ id, payload }, { extra }) => {
	const { userApi } = extra;

	return userApi.update(id, payload);
});

export { createUser, loadAll, loadUserById, updateUser };
