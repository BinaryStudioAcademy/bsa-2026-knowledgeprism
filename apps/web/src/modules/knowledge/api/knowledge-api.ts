import { APIPath, KnowledgeApiPath } from "@knowledgeprism/constants";
import {
	type KnowledgeEntryResponseDto,
	type KnowledgeSearchResponseDto,
	type KnowledgeTreeResponseDto,
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

class KnowledgeApi extends BaseHTTPApi {
	public constructor({ baseUrl, http, storage }: Constructor) {
		super({ baseUrl, http, path: APIPath.PROJECTS, storage });
	}

	public async getKnowledgeEntry({
		entryId,
		projectId,
		signal,
	}: {
		entryId: number;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<KnowledgeEntryResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(KnowledgeApiPath.ENTRY_$ID, {
				id: String(entryId),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
				signal,
			},
		);

		return await response.json<KnowledgeEntryResponseDto>();
	}

	public async getKnowledgeTree({
		projectId,
		signal,
	}: {
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<KnowledgeTreeResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(KnowledgeApiPath.ROOT, { projectId }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
				signal,
			},
		);

		return await response.json<KnowledgeTreeResponseDto>();
	}

	public async search({
		projectId,
		query,
		signal,
	}: {
		projectId: string;
		query: string;
		signal?: AbortSignal | undefined;
	}): Promise<KnowledgeSearchResponseDto> {
		const endpoint = `${this.getFullEndpoint(KnowledgeApiPath.SEARCH, { projectId })}?q=${encodeURIComponent(query)}`;

		const response = await this.load(endpoint, {
			contentType: ContentType.JSON,
			hasAuth: true,
			method: "GET",
			signal,
		});

		return await response.json<KnowledgeSearchResponseDto>();
	}
}

export { KnowledgeApi };
