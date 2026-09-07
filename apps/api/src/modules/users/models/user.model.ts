import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class UserModel extends AbstractModel {
	public email!: string;

	public firstName!: string;

	public lastName!: string;

	public organisationId!: number;

	public passwordHash!: string;

	public static override get tableName(): string {
		return DatabaseTableName.USERS;
	}
}

export { UserModel };
