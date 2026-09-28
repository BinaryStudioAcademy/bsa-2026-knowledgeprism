import {
	type UserCreateRequestDto,
	type UserDetailsResponseDto,
	type UserGetAllResponseDto,
	type UserUpdateRequestDto,
} from "@knowledgeprism/types";

import { NotificationVariant } from "~/lib/enums/enums.js";
import { notificationService } from "~/lib/notifications/notification.service.js";
import { createAppAsyncThunk } from "~/lib/store/store.module.js";

import { UserNotificationMessage } from "../libs/constants/user-notification-message.constant.js";
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
>(`${sliceName}/create`, async (payload, { extra }) => {
	const { userApi } = extra;

	const user = await userApi.create(payload);

	notificationService.notify({
		message: UserNotificationMessage.CREATED,
		variant: NotificationVariant.SUCCESS,
	});

	return user;
});

const updateUser = createAppAsyncThunk<
	UserDetailsResponseDto,
	{ id: number; payload: UserUpdateRequestDto }
>(`${sliceName}/update`, async ({ id, payload }, { extra }) => {
	const { userApi } = extra;

	const updatedUser = await userApi.update(id, payload);

	notificationService.notify({
		message: UserNotificationMessage.UPDATED,
		variant: NotificationVariant.SUCCESS,
	});

	return updatedUser;
});

export { createUser, loadAll, loadUserById, updateUser };
