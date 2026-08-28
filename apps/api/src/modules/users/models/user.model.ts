import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class UserModel extends AbstractModel {
	public email!: string;

	public firstName!: null | string;

	public lastName!: null | string;

	public organisationId!: null | number;

	public passwordHash!: string;

	public static override get tableName(): string {
		return DatabaseTableName.USERS;
	}
}

export { UserModel };
