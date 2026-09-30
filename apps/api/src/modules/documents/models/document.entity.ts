import {
	type DocumentSourceType,
	type DocumentStatus,
} from "@knowledgeprism/constants";
import {
	type DocumentProcessingProgressDto,
	type ValueOf,
} from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

type DocumentDetails = {
	content: null | string;
	contentHash: null | string;
	createdAt: Date;
	errorMessage: null | string;
	failedPageNumbers: number[];
	id: number;
	mimeType: string;
	name: string;
	processingAttempt: number;
	processingProgress: DocumentProcessingProgressDto | null;
	projectId: number;
	s3Key: null | string;
	sizeInBytes: null | number;
	sourceType: ValueOf<typeof DocumentSourceType>;
	status: ValueOf<typeof DocumentStatus>;
	updatedAt: Date;
	uploadedBy: null | number;
};

type DocumentEntityPayload = {
	content: null | string;
	contentHash: null | string;
	createdAt: Date | null;
	errorMessage: null | string;
	failedPageNumbers: number[];
	id: null | number;
	mimeType: string;
	name: string;
	processingAttempt: number;
	processingProgress: DocumentProcessingProgressDto | null;
	projectId: number;
	s3Key: null | string;
	sizeInBytes: null | number;
	sourceType: ValueOf<typeof DocumentSourceType>;
	status: ValueOf<typeof DocumentStatus>;
	updatedAt: Date | null;
	uploadedBy: null | number;
};

class DocumentEntity implements Entity {
	private content: null | string;

	private contentHash: null | string;

	private createdAt: Date | null;

	private errorMessage: null | string;

	private failedPageNumbers: number[];
	private id: null | number;
	private mimeType: string;

	private name: string;

	private processingAttempt: number;

	private processingProgress: DocumentProcessingProgressDto | null;

	private projectId: number;

	private s3Key: null | string;

	private sizeInBytes: null | number;

	private sourceType: ValueOf<typeof DocumentSourceType>;

	private status: ValueOf<typeof DocumentStatus>;

	private updatedAt: Date | null;

	private uploadedBy: null | number;

	private constructor({
		content,
		contentHash,
		createdAt,
		errorMessage,
		failedPageNumbers,
		id,
		mimeType,
		name,
		processingAttempt,
		processingProgress,
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
		this.failedPageNumbers = failedPageNumbers;
		this.processingAttempt = processingAttempt;
		this.processingProgress = processingProgress;
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
		failedPageNumbers,
		id,
		mimeType,
		name,
		processingAttempt,
		processingProgress,
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
		createdAt: Date;
		errorMessage: null | string;
		failedPageNumbers: number[];
		id: number;
		mimeType: string;
		name: string;
		processingAttempt: number;
		processingProgress: DocumentProcessingProgressDto | null;
		projectId: number;
		s3Key: null | string;
		sizeInBytes: null | number;
		sourceType: ValueOf<typeof DocumentSourceType>;
		status: ValueOf<typeof DocumentStatus>;
		updatedAt: Date;
		uploadedBy: null | number;
	}): DocumentEntity {
		return new DocumentEntity({
			content,
			contentHash,
			createdAt,
			errorMessage,
			failedPageNumbers,
			id,
			mimeType,
			name,
			processingAttempt,
			processingProgress,
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
		projectId: number;
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
			failedPageNumbers: [],
			id: null,
			mimeType,
			name,
			processingAttempt: 0,
			processingProgress: null,
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
		projectId: number;
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

	public toObject(): DocumentDetails {
		return {
			content: this.content,
			contentHash: this.contentHash,
			createdAt: this.createdAt as Date,
			errorMessage: this.errorMessage,
			failedPageNumbers: this.failedPageNumbers,
			id: this.id as number,
			mimeType: this.mimeType,
			name: this.name,
			processingAttempt: this.processingAttempt,
			processingProgress: this.processingProgress,
			projectId: this.projectId,
			s3Key: this.s3Key,
			sizeInBytes: this.sizeInBytes,
			sourceType: this.sourceType,
			status: this.status,
			updatedAt: this.updatedAt as Date,
			uploadedBy: this.uploadedBy,
		};
	}
}

export { DocumentEntity };
