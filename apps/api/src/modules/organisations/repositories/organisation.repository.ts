import { type Transaction } from "objection";

import { OrganisationEntity } from "~/modules/organisations/models/organisation.entity.js";
import { type OrganisationModel } from "~/modules/organisations/models/organisation.model.js";
import { type Repository } from "~/shared/types/types.js";

class OrganisationRepository implements Repository {
	private organisationModel: typeof OrganisationModel;

	public constructor(organisationModel: typeof OrganisationModel) {
		this.organisationModel = organisationModel;
	}

	public async create(
		entity: OrganisationEntity,
		transaction?: Transaction,
	): Promise<OrganisationEntity> {
		const { name } = entity.toNewObject();

		const organisation = await this.organisationModel
			.query(transaction)
			.insert({
				name,
			})
			.returning("*")
			.execute();

		return OrganisationEntity.initialize(organisation);
	}

	public delete(): ReturnType<Repository["delete"]> {
		return Promise.resolve(true);
	}

	public find(): ReturnType<Repository["find"]> {
		return Promise.resolve(null);
	}

	public findAll(): ReturnType<Repository["findAll"]> {
		return Promise.resolve([]);
	}

	public update(): ReturnType<Repository["update"]> {
		return Promise.resolve(null);
	}
}

export { OrganisationRepository };
