import { OrganisationModel } from "./models/organisation.model.js";
import { OrganisationRepository } from "./repositories/organisation.repository.js";
import { OrganisationService } from "./services/organisation.service.js";

const organisationRepository = new OrganisationRepository(OrganisationModel);
const organisationService = new OrganisationService(organisationRepository);

export { organisationService };
