import { type EncryptService } from "~/libs/services/encrypt/encrypt.service.js";
import { type Entity } from "~/shared/types/types.js";

const ID_REQUIRED_MESSAGE = "User id is required";

class UserEntity implements Entity {
	private _passwordHash: string;

	private email: string;

	private firstName: string;

	private id: null | number;

	private lastName: string;

	private organisationId: number;

	private constructor({
		email,
		firstName,
		id,
		lastName,
		organisationId,
		passwordHash,
	}: {
		email: string;
		firstName: string;
		id: null | number;
		lastName: string;
		organisationId: number;
		passwordHash: string;
	}) {
		this.id = id;
		this.email = email;
		this.firstName = firstName;
		this.lastName = lastName;
		this.organisationId = organisationId;
		this._passwordHash = passwordHash;
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
		firstName: string;
		id: number;
		lastName: string;
		organisationId: number;
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
		firstName,
		lastName,
		organisationId,
		passwordHash,
	}: {
		email: string;
		firstName: string;
		lastName: string;
		organisationId: number;
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
	} {
		return {
			email: this.email,
			firstName: this.firstName,
			lastName: this.lastName,
			organisationId: this.organisationId,
			passwordHash: this._passwordHash,
		};
	}

	public toObject(): {
		email: string;
		firstName: string;
		id: number;
		lastName: string;
		organisationId: number;
	} {
		return {
			email: this.email,
			firstName: this.firstName,
			id: this.getId(),
			lastName: this.lastName,
			organisationId: this.organisationId,
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
