import { type DocumentStatus } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

type DocumentObject = {
	id: number;
	mimeType: string;
	name: string;
	projectId: string;
	s3Key: string;
	sizeInBytes: null | number;
	status: ValueOf<typeof DocumentStatus>;
	uploadedBy: null | number;
};

class DocumentEntity implements Entity {
	private id: null | number;

	private mimeType: string;

	private name: string;

	private projectId: string;

	private s3Key: string;

	private sizeInBytes: null | number;

	private status: ValueOf<typeof DocumentStatus>;

	private uploadedBy: null | number;

	private constructor({
		id,
		mimeType,
		name,
		projectId,
		s3Key,
		sizeInBytes,
		status,
		uploadedBy,
	}: {
		id: null | number;
		mimeType: string;
		name: string;
		projectId: string;
		s3Key: string;
		sizeInBytes: null | number;
		status: ValueOf<typeof DocumentStatus>;
		uploadedBy: null | number;
	}) {
		this.id = id;
		this.mimeType = mimeType;
		this.name = name;
		this.projectId = projectId;
		this.s3Key = s3Key;
		this.sizeInBytes = sizeInBytes;
		this.status = status;
		this.uploadedBy = uploadedBy;
	}

	public static initialize({
		id,
		mimeType,
		name,
		projectId,
		s3Key,
		sizeInBytes,
		status,
		uploadedBy,
	}: {
		id: number;
		mimeType: string;
		name: string;
		projectId: string;
		s3Key: string;
		sizeInBytes: null | number;
		status: ValueOf<typeof DocumentStatus>;
		uploadedBy: null | number;
	}): DocumentEntity {
		return new DocumentEntity({
			id,
			mimeType,
			name,
			projectId,
			s3Key,
			sizeInBytes,
			status,
			uploadedBy,
		});
	}

	public static initializeNew({
		mimeType,
		name,
		projectId,
		s3Key,
		sizeInBytes,
		status,
		uploadedBy,
	}: {
		mimeType: string;
		name: string;
		projectId: string;
		s3Key: string;
		sizeInBytes: null | number;
		status: ValueOf<typeof DocumentStatus>;
		uploadedBy: null | number;
	}): DocumentEntity {
		return new DocumentEntity({
			id: null,
			mimeType,
			name,
			projectId,
			s3Key,
			sizeInBytes,
			status,
			uploadedBy,
		});
	}

	public toNewObject(): {
		mimeType: string;
		name: string;
		projectId: string;
		s3Key: string;
		sizeInBytes: null | number;
		status: ValueOf<typeof DocumentStatus>;
		uploadedBy: null | number;
	} {
		return {
			mimeType: this.mimeType,
			name: this.name,
			projectId: this.projectId,
			s3Key: this.s3Key,
			sizeInBytes: this.sizeInBytes,
			status: this.status,
			uploadedBy: this.uploadedBy,
		};
	}

	public toObject(): DocumentObject {
		return {
			id: this.id as number,
			mimeType: this.mimeType,
			name: this.name,
			projectId: this.projectId,
			s3Key: this.s3Key,
			sizeInBytes: this.sizeInBytes,
			status: this.status,
			uploadedBy: this.uploadedBy,
		};
	}
}

export { DocumentEntity };
