import { type ValueOf } from "@knowledgeprism/types";

import { type ProjectStorageCleanupStatus } from "~/modules/projects/libs/enums/enums.js";
import { type Entity } from "~/shared/types/types.js";

const CREATED_AT_REQUIRED_MESSAGE = "Storage cleanup creation date is required";
const DEFAULT_ATTEMPTS_COUNT = 0;
const ID_REQUIRED_MESSAGE = "Storage cleanup id is required";
const UPDATED_AT_REQUIRED_MESSAGE = "Storage cleanup update date is required";

class ProjectStorageCleanupEntity implements Entity {
	private attempts: number;

	private createdAt: Date | null;

	private errorMessage: null | string;

	private executeAfter: Date;

	private id: null | number;

	private prefix: string;

	private projectId: number;

	private status: ValueOf<typeof ProjectStorageCleanupStatus>;

	private updatedAt: Date | null;

	private constructor({
		attempts,
		createdAt,
		errorMessage,
		executeAfter,
		id,
		prefix,
		projectId,
		status,
		updatedAt,
	}: {
		attempts: number;
		createdAt: Date | null;
		errorMessage: null | string;
		executeAfter: Date;
		id: null | number;
		prefix: string;
		projectId: number;
		status: ValueOf<typeof ProjectStorageCleanupStatus>;
		updatedAt: Date | null;
	}) {
		this.attempts = attempts;
		this.createdAt = createdAt;
		this.errorMessage = errorMessage;
		this.executeAfter = executeAfter;
		this.id = id;
		this.prefix = prefix;
		this.projectId = projectId;
		this.status = status;
		this.updatedAt = updatedAt;
	}

	public static initialize({
		attempts,
		createdAt,
		errorMessage,
		executeAfter,
		id,
		prefix,
		projectId,
		status,
		updatedAt,
	}: {
		attempts: number;
		createdAt: Date;
		errorMessage: null | string;
		executeAfter: Date;
		id: number;
		prefix: string;
		projectId: number;
		status: ValueOf<typeof ProjectStorageCleanupStatus>;
		updatedAt: Date;
	}): ProjectStorageCleanupEntity {
		return new ProjectStorageCleanupEntity({
			attempts,
			createdAt,
			errorMessage,
			executeAfter,
			id,
			prefix,
			projectId,
			status,
			updatedAt,
		});
	}

	public static initializeNew({
		attempts = DEFAULT_ATTEMPTS_COUNT,
		errorMessage = null,
		executeAfter,
		prefix,
		projectId,
		status,
	}: {
		attempts?: number;
		errorMessage?: null | string;
		executeAfter: Date;
		prefix: string;
		projectId: number;
		status: ValueOf<typeof ProjectStorageCleanupStatus>;
	}): ProjectStorageCleanupEntity {
		return new ProjectStorageCleanupEntity({
			attempts,
			createdAt: null,
			errorMessage,
			executeAfter,
			id: null,
			prefix,
			projectId,
			status,
			updatedAt: null,
		});
	}

	private getCreatedAt(): Date {
		if (this.createdAt === null) {
			throw new Error(CREATED_AT_REQUIRED_MESSAGE);
		}

		return this.createdAt;
	}

	private getId(): number {
		if (this.id === null) {
			throw new Error(ID_REQUIRED_MESSAGE);
		}

		return this.id;
	}

	private getUpdatedAt(): Date {
		if (this.updatedAt === null) {
			throw new Error(UPDATED_AT_REQUIRED_MESSAGE);
		}

		return this.updatedAt;
	}

	public toNewObject(): {
		attempts: number;
		errorMessage: null | string;
		executeAfter: Date;
		prefix: string;
		projectId: number;
		status: ValueOf<typeof ProjectStorageCleanupStatus>;
	} {
		return {
			attempts: this.attempts,
			errorMessage: this.errorMessage,
			executeAfter: this.executeAfter,
			prefix: this.prefix,
			projectId: this.projectId,
			status: this.status,
		};
	}

	public toObject(): {
		attempts: number;
		createdAt: Date;
		errorMessage: null | string;
		executeAfter: Date;
		id: number;
		prefix: string;
		projectId: number;
		status: ValueOf<typeof ProjectStorageCleanupStatus>;
		updatedAt: Date;
	} {
		return {
			attempts: this.attempts,
			createdAt: this.getCreatedAt(),
			errorMessage: this.errorMessage,
			executeAfter: this.executeAfter,
			id: this.getId(),
			prefix: this.prefix,
			projectId: this.projectId,
			status: this.status,
			updatedAt: this.getUpdatedAt(),
		};
	}
}

export { ProjectStorageCleanupEntity };
