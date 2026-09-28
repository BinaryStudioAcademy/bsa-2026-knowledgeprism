import { APIPath, GlossaryApiPath } from "@knowledgeprism/constants";
import {
	type GlossaryConsistencyCheckResponseDto,
	type GlossaryTermRequestDto,
	type GlossaryTermResponseDto,
	type GlossaryTermsResponseDto,
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

class GlossaryApi extends BaseHTTPApi {
	public constructor({ baseUrl, http, storage }: Constructor) {
		super({ baseUrl, http, path: APIPath.PROJECTS, storage });
	}

	public async checkConsistency({
		content,
		projectId,
		signal,
	}: {
		content: string;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<GlossaryConsistencyCheckResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(GlossaryApiPath.CHECK_CONSISTENCY, { projectId }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify({ content }),
				signal,
			},
		);

		return await response.json<GlossaryConsistencyCheckResponseDto>();
	}

	public async create({
		payload,
		projectId,
	}: {
		payload: GlossaryTermRequestDto;
		projectId: string;
	}): Promise<GlossaryTermResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(GlossaryApiPath.ROOT, { projectId }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify(payload),
			},
		);

		return await response.json<GlossaryTermResponseDto>();
	}

	public async delete({
		id,
		projectId,
	}: {
		id: number;
		projectId: string;
	}): Promise<void> {
		await this.load(
			this.getFullEndpoint(GlossaryApiPath.TERM_$ID, {
				id: String(id),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "DELETE",
				payload: JSON.stringify({}),
			},
		);
	}

	public async getAll({
		projectId,
		query,
		signal,
	}: {
		projectId: string;
		query: string;
		signal?: AbortSignal | undefined;
	}): Promise<GlossaryTermsResponseDto> {
		const endpoint = `${this.getFullEndpoint(GlossaryApiPath.ROOT, { projectId })}?q=${encodeURIComponent(query)}`;

		const response = await this.load(endpoint, {
			contentType: ContentType.JSON,
			hasAuth: true,
			method: "GET",
			signal,
		});

		return await response.json<GlossaryTermsResponseDto>();
	}

	public async getById({
		id,
		projectId,
		signal,
	}: {
		id: number;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<GlossaryTermResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(GlossaryApiPath.TERM_$ID, {
				id: String(id),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
				signal,
			},
		);

		return await response.json<GlossaryTermResponseDto>();
	}

	public async update({
		id,
		payload,
		projectId,
	}: {
		id: number;
		payload: GlossaryTermRequestDto;
		projectId: string;
	}): Promise<GlossaryTermResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(GlossaryApiPath.TERM_$ID, {
				id: String(id),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "PATCH",
				payload: JSON.stringify(payload),
			},
		);

		return await response.json<GlossaryTermResponseDto>();
	}
}

export { GlossaryApi };
