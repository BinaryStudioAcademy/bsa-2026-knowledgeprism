import { type Transaction } from "objection";

import { OrganisationEntity } from "~/modules/organisations/models/organisation.entity.js";
import { type OrganisationRepository } from "~/modules/organisations/repositories/organisation.repository.js";
import { type Service } from "~/shared/types/types.js";

class OrganisationService implements Service {
	private organisationRepository: OrganisationRepository;

	public constructor(organisationRepository: OrganisationRepository) {
		this.organisationRepository = organisationRepository;
	}

	public create(
		payload: {
			name: string;
		},
		transaction?: Transaction,
	): Promise<OrganisationEntity> {
		return this.organisationRepository.create(
			OrganisationEntity.initializeNew(payload),
			transaction,
		);
	}

	public delete(): ReturnType<Service["delete"]> {
		return Promise.resolve(true);
	}

	public find(): ReturnType<Service["find"]> {
		return Promise.resolve(null);
	}

	public findAll(): ReturnType<Service["findAll"]> {
		return Promise.resolve({
			items: [],
		});
	}

	public update(): ReturnType<Service["update"]> {
		return Promise.resolve(null);
	}
}

export { OrganisationService };
