import { APIPath, DocumentsApiPath } from "@knowledgeprism/constants";
import {
	type DocumentConfirmUploadResponseDto,
	type DocumentStatusResponseDto,
	type DocumentUploadIntentRequestDto,
	type DocumentUploadIntentResponseDto,
	type IntegrationChangesResponseDto,
	type ManualTextCreateRequestDto,
	type ManualTextResponseDto,
} from "@knowledgeprism/types";

import { BaseHTTPApi } from "~/api/api.js";
import { ContentType } from "~/lib/enums/enums.js";
import { type HTTP } from "~/lib/http/http.js";
import { type Storage } from "~/lib/storage/storage.js";

import { PDF_MIME_TYPE } from "../libs/constants/constants.js";

type Constructor = {
	baseUrl: string;
	http: HTTP;
	storage: Storage;
};

class DocumentsApi extends BaseHTTPApi {
	public constructor({ baseUrl, http, storage }: Constructor) {
		super({ baseUrl, http, path: APIPath.PROJECTS, storage });
	}

	public async confirmUpload({
		documentId,
		projectId,
		signal,
	}: {
		documentId: number;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<DocumentConfirmUploadResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(DocumentsApiPath.CONFIRM_UPLOAD, {
				documentId: String(documentId),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify({}),
				signal,
			},
		);

		return await response.json<DocumentConfirmUploadResponseDto>();
	}

	public async createManualText({
		payload,
		projectId,
		signal,
	}: {
		payload: ManualTextCreateRequestDto;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<ManualTextResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(DocumentsApiPath.MANUAL_TEXT, { projectId }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify(payload),
				signal,
			},
		);

		return await response.json<ManualTextResponseDto>();
	}

	public async createUploadIntent({
		payload,
		projectId,
		signal,
	}: {
		payload: DocumentUploadIntentRequestDto;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<DocumentUploadIntentResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(DocumentsApiPath.UPLOAD_URL, { projectId }),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "POST",
				payload: JSON.stringify(payload),
				signal,
			},
		);

		return await response.json<DocumentUploadIntentResponseDto>();
	}

	public async getDocumentStatus({
		documentId,
		projectId,
		signal,
	}: {
		documentId: number;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<DocumentStatusResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(DocumentsApiPath.DOCUMENT_$ID, {
				documentId: String(documentId),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
				signal,
			},
		);

		return await response.json<DocumentStatusResponseDto>();
	}

	public async getIntegrationChanges({
		documentId,
		projectId,
		signal,
	}: {
		documentId: number;
		projectId: string;
		signal?: AbortSignal | undefined;
	}): Promise<IntegrationChangesResponseDto> {
		const response = await this.load(
			this.getFullEndpoint(DocumentsApiPath.INTEGRATION_CHANGES, {
				documentId: String(documentId),
				projectId,
			}),
			{
				contentType: ContentType.JSON,
				hasAuth: true,
				method: "GET",
				signal,
			},
		);

		return await response.json<IntegrationChangesResponseDto>();
	}

	public async uploadFileToStorage({
		file,
		signal,
		uploadUrl,
	}: {
		file: File;
		signal?: AbortSignal | undefined;
		uploadUrl: string;
	}): Promise<void> {
		const response = await fetch(uploadUrl, {
			body: file,
			headers: { "Content-Type": file.type || PDF_MIME_TYPE },
			method: "PUT",
			...(signal && { signal }),
		});

		if (!response.ok) {
			throw new Error("Failed to upload file to storage.");
		}
	}
}

export { DocumentsApi };
