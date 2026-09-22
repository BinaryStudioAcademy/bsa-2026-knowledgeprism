import { ProjectsApiPath } from "@knowledgeprism/constants";
import { type ProjectGetAllResponseDto } from "@knowledgeprism/types";

import { BaseHTTPApi } from "~/api/api.js";
import { APIPath, ContentType } from "~/lib/enums/enums.js";
import { type HTTP } from "~/lib/http/http.js";
import { type Storage } from "~/lib/storage/storage.js";

type Constructor = {
	baseUrl: string;
	http: HTTP;
	storage: Storage;
};

class ProjectsApi extends BaseHTTPApi {
	public constructor({ baseUrl, http, storage }: Constructor) {
		super({ baseUrl, http, path: APIPath.PROJECTS, storage });
	}

	public async getAll(): Promise<ProjectGetAllResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(ProjectsApiPath.ROOT, {}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
			},
		);

		return await response.json<ProjectGetAllResponseDto>();
	}
}

export { ProjectsApi };
