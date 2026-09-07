import { DocumentSourceType, DocumentStatus } from "@knowledgeprism/constants";
import {
	type ManualTextResponseDto,
	type ValueOf,
} from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

type DocumentEntityPayload = {
	content: string;
	contentHash: string;
	createdAt: null | string;
	createdByUserId: number;
	errorMessage: null | string;
	id: null | number;
	projectId: number;
	sourceType: ValueOf<typeof DocumentSourceType>;
	status: ValueOf<typeof DocumentStatus>;
	title: null | string;
	updatedAt: null | string;
};

class DocumentEntity implements Entity {
	private content: string;

	private contentHash: string;

	private createdAt: null | string;

	private createdByUserId: number;

	private errorMessage: null | string;

	private id: null | number;

	private projectId: number;

	private sourceType: ValueOf<typeof DocumentSourceType>;

	private status: ValueOf<typeof DocumentStatus>;

	private title: null | string;

	private updatedAt: null | string;

	private constructor({
		content,
		contentHash,
		createdAt,
		createdByUserId,
		errorMessage,
		id,
		projectId,
		sourceType,
		status,
		title,
		updatedAt,
	}: DocumentEntityPayload) {
		this.content = content;
		this.contentHash = contentHash;
		this.createdAt = createdAt;
		this.createdByUserId = createdByUserId;
		this.errorMessage = errorMessage;
		this.id = id;
		this.projectId = projectId;
		this.sourceType = sourceType;
		this.status = status;
		this.title = title;
		this.updatedAt = updatedAt;
	}

	public static initialize({
		content,
		contentHash,
		createdAt,
		createdByUserId,
		errorMessage,
		id,
		projectId,
		sourceType,
		status,
		title,
		updatedAt,
	}: {
		content: string;
		contentHash: string;
		createdAt: string;
		createdByUserId: number;
		errorMessage: null | string;
		id: number;
		projectId: number;
		sourceType: ValueOf<typeof DocumentSourceType>;
		status: ValueOf<typeof DocumentStatus>;
		title: null | string;
		updatedAt: string;
	}): DocumentEntity {
		return new DocumentEntity({
			content,
			contentHash,
			createdAt,
			createdByUserId,
			errorMessage,
			id,
			projectId,
			sourceType,
			status,
			title,
			updatedAt,
		});
	}

	public static initializeNew({
		content,
		contentHash,
		createdByUserId,
		projectId,
		title,
	}: {
		content: string;
		contentHash: string;
		createdByUserId: number;
		projectId: number;
		title: null | string;
	}): DocumentEntity {
		return new DocumentEntity({
			content,
			contentHash,
			createdAt: null,
			createdByUserId,
			errorMessage: null,
			id: null,
			projectId,
			sourceType: DocumentSourceType.MANUAL,
			status: DocumentStatus.PROCESSING,
			title,
			updatedAt: null,
		});
	}

	public toNewObject(): {
		content: string;
		contentHash: string;
		createdByUserId: number;
		errorMessage: null | string;
		projectId: number;
		sourceType: ValueOf<typeof DocumentSourceType>;
		status: ValueOf<typeof DocumentStatus>;
		title: null | string;
	} {
		return {
			content: this.content,
			contentHash: this.contentHash,
			createdByUserId: this.createdByUserId,
			errorMessage: this.errorMessage,
			projectId: this.projectId,
			sourceType: this.sourceType,
			status: this.status,
			title: this.title,
		};
	}

	public toObject(): ManualTextResponseDto {
		return {
			createdAt: this.createdAt as string,
			errorMessage: this.errorMessage,
			id: this.id as number,
			projectId: this.projectId,
			sourceType: this.sourceType,
			status: this.status,
			title: this.title,
			updatedAt: this.updatedAt as string,
		};
	}
}

export { DocumentEntity };
