import { type ProjectAssignmentDto } from "@knowledgeprism/types";

import { type EncryptService } from "~/libs/services/encrypt/encrypt.service.js";
import { type Entity } from "~/shared/types/types.js";

const ID_REQUIRED_MESSAGE = "User id is required";

class UserEntity implements Entity {
	private _passwordHash: string;

	private assignedProjects: ProjectAssignmentDto[];

	private email: string;

	private firstName: string;

	private id: null | number;

	private lastName: string;

	private organisationId: number;

	private status: "active" | "inactive";

	private constructor({
		assignedProjects,
		email,
		firstName,
		id,
		lastName,
		organisationId,
		passwordHash,
		status,
	}: {
		assignedProjects?: ProjectAssignmentDto[];
		email: string;
		firstName: string;
		id: null | number;
		lastName: string;
		organisationId: number;
		passwordHash: string;
		status: "active" | "inactive";
	}) {
		this.assignedProjects = assignedProjects ?? [];
		this.email = email;
		this.firstName = firstName;
		this.id = id;
		this.lastName = lastName;
		this.organisationId = organisationId;
		this._passwordHash = passwordHash;
		this.status = status;
	}

	public static initialize({
		assignedProjects,
		email,
		firstName,
		id,
		lastName,
		organisationId,
		passwordHash,
		status,
	}: {
		assignedProjects?: ProjectAssignmentDto[];
		email: string;
		firstName: string;
		id: number;
		lastName: string;
		organisationId: number;
		passwordHash: string;
		status: "active" | "inactive";
	}): UserEntity {
		return new UserEntity({
			...(assignedProjects && { assignedProjects }),
			email,
			firstName,
			id,
			lastName,
			organisationId,
			passwordHash,
			status,
		});
	}

	public static initializeNew({
		assignedProjects,
		email,
		firstName,
		lastName,
		organisationId,
		passwordHash,
		status,
	}: {
		assignedProjects?: ProjectAssignmentDto[];
		email: string;
		firstName: string;
		lastName: string;
		organisationId: number;
		passwordHash: string;
		status: "active" | "inactive";
	}): UserEntity {
		return new UserEntity({
			...(assignedProjects && { assignedProjects }),
			email,
			firstName,
			id: null,
			lastName,
			organisationId,
			passwordHash,
			status,
		});
	}

	private getId(): number {
		if (this.id === null) {
			throw new Error(ID_REQUIRED_MESSAGE);
		}

		return this.id;
	}

	public toNewObject(): {
		email: string;
		firstName: string;
		lastName: string;
		organisationId: number;
		passwordHash: string;
		status: "active" | "inactive";
	} {
		return {
			email: this.email,
			firstName: this.firstName,
			lastName: this.lastName,
			organisationId: this.organisationId,
			passwordHash: this._passwordHash,
			status: this.status,
		};
	}

	public toObject(): {
		assignedProjects: ProjectAssignmentDto[];
		email: string;
		firstName: string;
		id: number;
		lastName: string;
		organisationId: number;
		status: "active" | "inactive";
	} {
		return {
			assignedProjects: this.assignedProjects,
			email: this.email,
			firstName: this.firstName,
			id: this.getId(),
			lastName: this.lastName,
			organisationId: this.organisationId,
			status: this.status,
		};
	}

	public toSignUpObject(): {
		email: string;
		firstName: string;
		id: number;
		lastName: string;
	} {
		return {
			email: this.email,
			firstName: this.firstName,
			id: this.getId(),
			lastName: this.lastName,
		};
	}

	public async validatePassword(
		password: string,
		encryptService: EncryptService,
	): Promise<boolean> {
		return await encryptService.compare({
			data: password,
			hash: this._passwordHash,
		});
	}
}

export { UserEntity };
