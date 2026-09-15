import { type Entity } from "~/shared/types/types.js";

const CREATED_AT_REQUIRED_MESSAGE = "Project creation date is required";
const ID_REQUIRED_MESSAGE = "Project id is required";
const UPDATED_AT_REQUIRED_MESSAGE = "Project update date is required";

class ProjectEntity implements Entity {
	private createdAt: Date | null;

	private description: null | string;

	private id: null | number;

	private name: string;

	private organisationId: number;

	private updatedAt: Date | null;

	private constructor({
		createdAt,
		description,
		id,
		name,
		organisationId,
		updatedAt,
	}: {
		createdAt: Date | null;
		description: null | string;
		id: null | number;
		name: string;
		organisationId: number;
		updatedAt: Date | null;
	}) {
		this.createdAt = createdAt;
		this.description = description;
		this.id = id;
		this.name = name;
		this.organisationId = organisationId;
		this.updatedAt = updatedAt;
	}

	public static initialize({
		createdAt,
		description,
		id,
		name,
		organisationId,
		updatedAt,
	}: {
		createdAt: Date;
		description: null | string;
		id: number;
		name: string;
		organisationId: number;
		updatedAt: Date;
	}): ProjectEntity {
		return new ProjectEntity({
			createdAt,
			description,
			id,
			name,
			organisationId,
			updatedAt,
		});
	}

	public static initializeNew({
		description,
		name,
		organisationId,
	}: {
		description: null | string;
		name: string;
		organisationId: number;
	}): ProjectEntity {
		return new ProjectEntity({
			createdAt: null,
			description,
			id: null,
			name,
			organisationId,
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
		description: null | string;
		name: string;
		organisationId: number;
	} {
		return {
			description: this.description,
			name: this.name,
			organisationId: this.organisationId,
		};
	}

	public toObject(): {
		createdAt: Date;
		description: null | string;
		id: number;
		name: string;
		organisationId: number;
		updatedAt: Date;
	} {
		return {
			createdAt: this.getCreatedAt(),
			description: this.description,
			id: this.getId(),
			name: this.name,
			organisationId: this.organisationId,
			updatedAt: this.getUpdatedAt(),
		};
	}
}

export { ProjectEntity };
