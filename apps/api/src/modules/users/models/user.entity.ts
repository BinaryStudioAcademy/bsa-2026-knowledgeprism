import { type Entity } from "~/shared/types/types.js";

class UserEntity implements Entity {
	private email: string;

	private firstName: null | string;

	private id: null | number;

	private lastName: null | string;

	private organisationId: null | number;

	private passwordHash: string;

	private constructor({
		email,
		firstName,
		id,
		lastName,
		organisationId,
		passwordHash,
	}: {
		email: string;
		firstName: null | string;
		id: null | number;
		lastName: null | string;
		organisationId: null | number;
		passwordHash: string;
	}) {
		this.id = id;
		this.email = email;
		this.firstName = firstName;
		this.lastName = lastName;
		this.organisationId = organisationId;
		this.passwordHash = passwordHash;
	}

	public static initialize({
		email,
		firstName,
		id,
		lastName,
		organisationId,
		passwordHash,
	}: {
		email: string;
		firstName: null | string;
		id: number;
		lastName: null | string;
		organisationId: null | number;
		passwordHash: string;
	}): UserEntity {
		return new UserEntity({
			email,
			firstName,
			id,
			lastName,
			organisationId,
			passwordHash,
		});
	}

	public static initializeNew({
		email,
		firstName = null,
		lastName = null,
		organisationId = null,
		passwordHash,
	}: {
		email: string;
		firstName?: null | string;
		lastName?: null | string;
		organisationId?: null | number;
		passwordHash: string;
	}): UserEntity {
		return new UserEntity({
			email,
			firstName,
			id: null,
			lastName,
			organisationId,
			passwordHash,
		});
	}

	public toNewObject(): {
		email: string;
		firstName: null | string;
		lastName: null | string;
		organisationId: null | number;
		passwordHash: string;
	} {
		return {
			email: this.email,
			firstName: this.firstName,
			lastName: this.lastName,
			organisationId: this.organisationId,
			passwordHash: this.passwordHash,
		};
	}

	public toObject(): {
		email: string;
		id: number;
	} {
		return {
			email: this.email,
			id: this.id as number,
		};
	}

	public toRegisterObject(): {
		email: string;
		firstName: string;
		id: number;
		lastName: string;
	} {
		return {
			email: this.email,
			firstName: this.firstName as string,
			id: this.id as number,
			lastName: this.lastName as string,
		};
	}
}

export { UserEntity };
