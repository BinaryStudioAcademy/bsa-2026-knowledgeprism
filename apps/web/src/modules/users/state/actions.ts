import {
	type UserCreateRequestDto,
	type UserDetailsResponseDto,
	type UserGetAllResponseDto,
	type UserUpdateRequestDto,
} from "@knowledgeprism/types";
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

const loadUserById = createAsyncThunk<
	UserDetailsResponseDto,
	number,
	AsyncThunkConfig
>(`${sliceName}/load-by-id`, (id, { extra }) => {
	const { userApi } = extra;

	return userApi.getById(id);
});

const createUser = createAsyncThunk<
	UserDetailsResponseDto,
	UserCreateRequestDto,
	AsyncThunkConfig
>(`${sliceName}/create`, (payload, { extra }) => {
	const { userApi } = extra;

	return userApi.create(payload);
});

const updateUser = createAsyncThunk<
	UserDetailsResponseDto,
	{ id: number; payload: UserUpdateRequestDto },
	AsyncThunkConfig
>(`${sliceName}/update`, ({ id, payload }, { extra }) => {
	const { userApi } = extra;

	return userApi.update(id, payload);
});

export { createUser, loadAll, loadUserById, updateUser };
