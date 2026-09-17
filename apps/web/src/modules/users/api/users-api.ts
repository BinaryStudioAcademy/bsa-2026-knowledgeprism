import { UsersApiPath } from "@knowledgeprism/constants";
import {
	type UserCreateRequestDto,
	type UserDetailsResponseDto,
	type UserGetAllResponseDto,
	type UserUpdateRequestDto,
} from "@knowledgeprism/types";

import { BaseHTTPApi } from "~/api/api.js";
import { APIPath, ContentType } from "~/lib/enums/enums.js";
import { type HTTP } from "~/lib/http/http.js";
import { type Storage } from "~/lib/storage/storage.js";

type Constructor = {
	baseUrl: string;
	http: HTTP;
	storage: Storage;
};

class UserApi extends BaseHTTPApi {
	public constructor({ baseUrl, http, storage }: Constructor) {
		super({ baseUrl, http, path: APIPath.USERS, storage });
	}

	public async create(
		payload: UserCreateRequestDto,
	): Promise<UserDetailsResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(UsersApiPath.ROOT, {}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify(payload),
			},
		);

		return await response.json<UserDetailsResponseDto>();
	}

	public async getAll(): Promise<UserGetAllResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(UsersApiPath.ROOT, {}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
			},
		);

		return await response.json<UserGetAllResponseDto>();
	}

	public async getById(id: number): Promise<UserDetailsResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(UsersApiPath.ID, { id: id.toString() }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
			},
		);

		return await response.json<UserDetailsResponseDto>();
	}

	public async update(
		id: number,
		payload: UserUpdateRequestDto,
	): Promise<UserDetailsResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(UsersApiPath.ID, { id: id.toString() }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "PATCH",
				payload: JSON.stringify(payload),
			},
		);

		return await response.json<UserDetailsResponseDto>();
	}
}

export { UserApi };
