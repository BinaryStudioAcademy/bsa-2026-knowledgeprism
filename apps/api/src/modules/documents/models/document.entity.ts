import {
	type DocumentSourceType,
	type DocumentStatus,
} from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

type DocumentEntityPayload = {
	content: null | string;
	contentHash: null | string;
	createdAt: null | string;
	errorMessage: null | string;
	id: null | number;
	mimeType: string;
	name: string;
	projectId: string;
	s3Key: null | string;
	sizeInBytes: null | number;
	sourceType: ValueOf<typeof DocumentSourceType>;
	status: ValueOf<typeof DocumentStatus>;
	updatedAt: null | string;
	uploadedBy: null | number;
};

type DocumentObject = {
	content: null | string;
	contentHash: null | string;
	createdAt: string;
	errorMessage: null | string;
	id: number;
	mimeType: string;
	name: string;
	projectId: string;
	s3Key: null | string;
	sizeInBytes: null | number;
	sourceType: ValueOf<typeof DocumentSourceType>;
	status: ValueOf<typeof DocumentStatus>;
	updatedAt: string;
	uploadedBy: null | number;
};

class DocumentEntity implements Entity {
	private content: null | string;

	private contentHash: null | string;

	private createdAt: null | string;

	private errorMessage: null | string;

	private id: null | number;

	private mimeType: string;

	private name: string;

	private projectId: string;

	private s3Key: null | string;

	private sizeInBytes: null | number;

	private sourceType: ValueOf<typeof DocumentSourceType>;

	private status: ValueOf<typeof DocumentStatus>;

	private updatedAt: null | string;

	private uploadedBy: null | number;

	private constructor({
		content,
		contentHash,
		createdAt,
		errorMessage,
		id,
		mimeType,
		name,
		projectId,
		s3Key,
		sizeInBytes,
		sourceType,
		status,
		updatedAt,
		uploadedBy,
	}: DocumentEntityPayload) {
		this.content = content;
		this.contentHash = contentHash;
		this.createdAt = createdAt;
		this.errorMessage = errorMessage;
		this.id = id;
		this.mimeType = mimeType;
		this.name = name;
		this.projectId = projectId;
		this.s3Key = s3Key;
		this.sizeInBytes = sizeInBytes;
		this.sourceType = sourceType;
		this.status = status;
		this.updatedAt = updatedAt;
		this.uploadedBy = uploadedBy;
	}

	public static initialize({
		content,
		contentHash,
		createdAt,
		errorMessage,
		id,
		mimeType,
		name,
		projectId,
		s3Key,
		sizeInBytes,
		sourceType,
		status,
		updatedAt,
		uploadedBy,
	}: {
		content: null | string;
		contentHash: null | string;
		createdAt: string;
		errorMessage: null | string;
		id: number;
		mimeType: string;
		name: string;
		projectId: string;
		s3Key: null | string;
		sizeInBytes: null | number;
		sourceType: ValueOf<typeof DocumentSourceType>;
		status: ValueOf<typeof DocumentStatus>;
		updatedAt: string;
		uploadedBy: null | number;
	}): DocumentEntity {
		return new DocumentEntity({
			content,
			contentHash,
			createdAt,
			errorMessage,
			id,
			mimeType,
			name,
			projectId,
			s3Key,
			sizeInBytes,
			sourceType,
			status,
			updatedAt,
			uploadedBy,
		});
	}

	public static initializeNew({
		content,
		contentHash,
		errorMessage,
		mimeType,
		name,
		projectId,
		s3Key,
		sizeInBytes,
		sourceType,
		status,
		uploadedBy,
	}: {
		content: null | string;
		contentHash: null | string;
		errorMessage: null | string;
		mimeType: string;
		name: string;
		projectId: string;
		s3Key: null | string;
		sizeInBytes: null | number;
		sourceType: ValueOf<typeof DocumentSourceType>;
		status: ValueOf<typeof DocumentStatus>;
		uploadedBy: null | number;
	}): DocumentEntity {
		return new DocumentEntity({
			content,
			contentHash,
			createdAt: null,
			errorMessage,
			id: null,
			mimeType,
			name,
			projectId,
			s3Key,
			sizeInBytes,
			sourceType,
			status,
			updatedAt: null,
			uploadedBy,
		});
	}

	public toNewObject(): {
		content: null | string;
		contentHash: null | string;
		errorMessage: null | string;
		mimeType: string;
		name: string;
		projectId: string;
		s3Key: null | string;
		sizeInBytes: null | number;
		sourceType: ValueOf<typeof DocumentSourceType>;
		status: ValueOf<typeof DocumentStatus>;
		uploadedBy: null | number;
	} {
		return {
			content: this.content,
			contentHash: this.contentHash,
			errorMessage: this.errorMessage,
			mimeType: this.mimeType,
			name: this.name,
			projectId: this.projectId,
			s3Key: this.s3Key,
			sizeInBytes: this.sizeInBytes,
			sourceType: this.sourceType,
			status: this.status,
			uploadedBy: this.uploadedBy,
		};
	}

	public toObject(): DocumentObject {
		return {
			content: this.content,
			contentHash: this.contentHash,
			createdAt: this.createdAt as string,
			errorMessage: this.errorMessage,
			id: this.id as number,
			mimeType: this.mimeType,
			name: this.name,
			projectId: this.projectId,
			s3Key: this.s3Key,
			sizeInBytes: this.sizeInBytes,
			sourceType: this.sourceType,
			status: this.status,
			updatedAt: this.updatedAt as string,
			uploadedBy: this.uploadedBy,
		};
	}
}

export { DocumentEntity };
