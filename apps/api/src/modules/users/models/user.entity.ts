import { type ProjectAssignmentDto } from "@knowledgeprism/types";

import { type Entity } from "~/shared/types/types.js";

class UserEntity implements Entity {
	private assignedProjects: ProjectAssignmentDto[];

	private email: string;

	private firstName: null | string;

	private id: null | number;

	private lastName: null | string;

	private organisationId: null | number;

	private passwordHash: string;

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
		firstName: null | string;
		id: null | number;
		lastName: null | string;
		organisationId: null | number;
		passwordHash: string;
		status: "active" | "inactive";
	}) {
		this.assignedProjects = assignedProjects ?? [];
		this.email = email;
		this.firstName = firstName;
		this.id = id;
		this.lastName = lastName;
		this.organisationId = organisationId;
		this.passwordHash = passwordHash;
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
		firstName: null | string;
		id: number;
		lastName: null | string;
		organisationId: null | number;
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
		firstName: null | string;
		lastName: null | string;
		organisationId: null | number;
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

	public toNewObject(): {
		email: string;
		firstName: null | string;
		lastName: null | string;
		organisationId: null | number;
		passwordHash: string;
		status: "active" | "inactive";
	} {
		return {
			email: this.email,
			firstName: this.firstName,
			lastName: this.lastName,
			organisationId: this.organisationId,
			passwordHash: this.passwordHash,
			status: this.status,
		};
	}

	public toObject(): {
		assignedProjects: ProjectAssignmentDto[];
		email: string;
		firstName: null | string;
		id: number;
		lastName: null | string;
		organisationId: null | number;
		status: "active" | "inactive";
	} {
		return {
			assignedProjects: this.assignedProjects,
			email: this.email,
			firstName: this.firstName,
			id: this.id as number,
			lastName: this.lastName,
			organisationId: this.organisationId,
			status: this.status,
		};
	}
}

export { UserEntity };
