import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class OrganisationModel extends AbstractModel {
	public name!: string;

	public static override get tableName(): string {
		return DatabaseTableName.ORGANISATIONS;
	}
}

export { OrganisationModel };
