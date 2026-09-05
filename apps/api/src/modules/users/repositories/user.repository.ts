import { type Transaction } from "objection";

import { UserEntity } from "~/modules/users/models/user.entity.js";
import { type UserModel } from "~/modules/users/models/user.model.js";
import { type Repository } from "~/shared/types/types.js";

class UserRepository implements Repository {
	private userModel: typeof UserModel;
	public constructor(userModel: typeof UserModel) {
		this.userModel = userModel;
	}

	public async create(
		entity: UserEntity,
		transaction?: Transaction,
	): Promise<UserEntity> {
		const { email, firstName, lastName, organisationId, passwordHash } =
			entity.toNewObject();

		const user = await this.userModel
			.query(transaction)
			.insert({
				email,
				firstName,
				lastName,
				organisationId,
				passwordHash,
			})
			.returning("*")
			.execute();

		return UserEntity.initialize(user);
	}

	public delete(): ReturnType<Repository["delete"]> {
		return Promise.resolve(true);
	}

	public find(): ReturnType<Repository["find"]> {
		return Promise.resolve(null);
	}

	public async findAll(): Promise<UserEntity[]> {
		const users = await this.userModel.query().execute();

		return users.map((user) => UserEntity.initialize(user));
	}

	public async findByEmail(
		email: string,
		transaction?: Transaction,
	): Promise<null | UserEntity> {
		const user = await this.userModel
			.query(transaction)
			.findOne({
				email,
			})
			.execute();

		return user ? UserEntity.initialize(user) : null;
	}

	public async findById(
		id: number,
		transaction?: Transaction,
	): Promise<null | UserEntity> {
		const user = await this.userModel.query(transaction).findById(id).execute();

		return user ? UserEntity.initialize(user) : null;
	}

	public update(): ReturnType<Repository["update"]> {
		return Promise.resolve(null);
	}
}

export { UserRepository };
