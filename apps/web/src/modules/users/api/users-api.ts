import { UsersApiPath } from "@knowledgeprism/constants";
import { type UserGetAllResponseDto } from "@knowledgeprism/types";

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

	public async getAll(): Promise<UserGetAllResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(UsersApiPath.ROOT, {}),
			{
				contentType: ContentType.JSON,
				hasAuth: false,
				method: "GET",
			},
		);

		return await response.json<UserGetAllResponseDto>();
	}
}

export { UserApi };
