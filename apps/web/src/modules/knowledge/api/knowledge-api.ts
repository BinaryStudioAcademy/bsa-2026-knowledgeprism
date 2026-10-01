import { APIPath, KnowledgeApiPath } from "@knowledgeprism/constants";
import {
	type KnowledgeDocumentCreateRequestDto,
	type KnowledgeDocumentMoveRequestDto,
	type KnowledgeEntryResponseDto,
	type KnowledgeEntryUpdateRequestDto,
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

	public async createDocumentNode({
		parentId,
		projectId,
		signal,
		title,
	}: {
		parentId: null | number;
		projectId: string;
		signal?: AbortSignal | undefined;
		title: string;
	}): Promise<KnowledgeEntryResponseDto> {
		const payload: KnowledgeDocumentCreateRequestDto = { parentId, title };
		const response = await this.load(
			this.getFullEndpoint(KnowledgeApiPath.ROOT, { projectId }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify(payload),
				signal,
			},
		);

		return await response.json<KnowledgeEntryResponseDto>();
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

	public async moveDocumentNode({
		documentId,
		parentId,
		position,
		projectId,
		signal,
	}: {
		documentId: number;
		parentId: null | number;
		position: number;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<KnowledgeEntryResponseDto> {
		const payload: KnowledgeDocumentMoveRequestDto = { parentId, position };
		const response = await this.load(
			this.getFullEndpoint(KnowledgeApiPath.PLACEMENT_$ID, {
				id: String(documentId),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "PATCH",
				payload: JSON.stringify(payload),
				signal,
			},
		);

		return await response.json<KnowledgeEntryResponseDto>();
	}

	public async removeDocumentNode({
		documentId,
		projectId,
		signal,
	}: {
		documentId: number;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<void> {
		await this.load(
			this.getFullEndpoint(KnowledgeApiPath.ENTRY_$ID, {
				id: String(documentId),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "DELETE",
				payload: JSON.stringify({}),
				signal,
			},
		);
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

	public async updateKnowledgeEntry({
		entryId,
		payload,
		projectId,
		signal,
	}: {
		entryId: number;
		payload: KnowledgeEntryUpdateRequestDto;
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
				method: "PATCH",
				payload: JSON.stringify(payload),
				signal,
			},
		);

		return await response.json<KnowledgeEntryResponseDto>();
	}
}

export { KnowledgeApi };
