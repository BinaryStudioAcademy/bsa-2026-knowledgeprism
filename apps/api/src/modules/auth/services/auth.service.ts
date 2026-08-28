import {
	type UserSignUpRequestDto,
	type UserSignUpResponseDto,
} from "@knowledgeprism/types";

import { type Database } from "~/infrastructure/database/database.js";
import { type OrganisationService } from "~/modules/organisations/services/organisation.service.js";
import { type UserService } from "~/modules/users/services/user.service.js";

class AuthService {
	private database: Database;

	private organisationService: OrganisationService;

	private userService: UserService;

	public constructor(
		userService: UserService,
		organisationService: OrganisationService,
		database: Database,
	) {
		this.database = database;
		this.organisationService = organisationService;
		this.userService = userService;
	}

	public signUp(payload: UserSignUpRequestDto): Promise<UserSignUpResponseDto> {
		return this.database.transaction(async (transaction) => {
			const organisation = await this.organisationService.create(
				{
					name: payload.organisationName,
				},
				transaction,
			);
			const organisationObject = organisation.toObject();
			const user = await this.userService.createOrganisationAdmin(
				{
					...payload,
					organisationId: organisationObject.id,
				},
				transaction,
			);

			return {
				organisation: organisationObject,
				user: user.toSignUpObject(),
			};
		});
	}
}

export { AuthService };
