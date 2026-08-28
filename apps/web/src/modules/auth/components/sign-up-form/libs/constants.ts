import { type UserSignUpRequestDto } from "@knowledgeprism/types";

type SignUpFormValues = UserSignUpRequestDto & {
	agreeToTerms: boolean;
};

const DEFAULT_SIGN_UP_PAYLOAD: SignUpFormValues = {
	agreeToTerms: false,
	email: "",
	firstName: "First name",
	lastName: "Last name",
	organisationName: "Organisation",
	password: "",
};

export { type SignUpFormValues, DEFAULT_SIGN_UP_PAYLOAD };
