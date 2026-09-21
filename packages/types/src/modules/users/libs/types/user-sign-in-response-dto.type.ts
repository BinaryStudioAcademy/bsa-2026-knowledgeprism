import { type OrganisationRole } from "@knowledgeprism/constants";

type UserSignInResponseDto = {
	organisation: {
		id: number;
		name: string;
	};
	user: {
		email: string;
		firstName: string;
		id: number;
		lastName: string;
		organisationRole:
			null | typeof OrganisationRole.ADMIN | typeof OrganisationRole.USER;
	};
};

export { type UserSignInResponseDto };
