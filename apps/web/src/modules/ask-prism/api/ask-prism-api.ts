import { APIPath, AskPrismApiPath } from "@knowledgeprism/constants";
import {
	type AskPrismRequestDto,
	type AskPrismResponseDto,
} from "@knowledgeprism/types";

import { BaseHTTPApi } from "~/api/api.js";
import { ContentType } from "~/lib/enums/enums.js";
import { type HTTP } from "~/lib/http/http.js";
import { type Storage } from "~/lib/storage/storage.js";

type Constructor = {
	baseUrl: string;
	http: HTTP;
	storage: Storage;
};

class AskPrismApi extends BaseHTTPApi {
	public constructor({ baseUrl, http, storage }: Constructor) {
		super({ baseUrl, http, path: APIPath.PROJECTS, storage });
	}

	public async ask(
		projectId: number | string,
		payload: AskPrismRequestDto,
	): Promise<AskPrismResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(AskPrismApiPath.ROOT, {
				projectId: String(projectId),
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify(payload),
			},
		);

		return await response.json<AskPrismResponseDto>();
	}

	public async getSuggestedQuestions(
		projectId: number | string,
	): Promise<string[]> {
		const response = await this.load(
			this.getFullEndpoint(AskPrismApiPath.SUGGESTIONS, {
				projectId: String(projectId),
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
			},
		);

		return await response.json<string[]>();
	}
}

export { AskPrismApi };
