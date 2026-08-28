import { type UserSignUpRequestDto } from "@knowledgeprism/types";

const DEFAULT_SIGN_UP_PAYLOAD: UserSignUpRequestDto = {
	email: "",
	firstName: "First name",
	lastName: "Last name",
	organisationName: "Organisation",
	password: "",
};

export { DEFAULT_SIGN_UP_PAYLOAD };
