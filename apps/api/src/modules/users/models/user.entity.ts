import { type Entity } from "~/shared/types/types.js";

class UserEntity implements Entity {
	private email: string;

	private id: null | number;

	private passwordHash: string;

	private constructor({
		email,
		id,
		passwordHash,
	}: {
		email: string;
		id: null | number;
		passwordHash: string;
	}) {
		this.id = id;
		this.email = email;
		this.passwordHash = passwordHash;
	}

	public static initialize({
		email,
		id,
		passwordHash,
	}: {
		email: string;
		id: number;
		passwordHash: string;
	}): UserEntity {
		return new UserEntity({
			email,
			id,
			passwordHash,
		});
	}

	public static initializeNew({
		email,
		passwordHash,
	}: {
		email: string;
		passwordHash: string;
	}): UserEntity {
		return new UserEntity({
			email,
			id: null,
			passwordHash,
		});
	}

	public toNewObject(): {
		email: string;
		passwordHash: string;
	} {
		return {
			email: this.email,
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
}

export { UserEntity };
