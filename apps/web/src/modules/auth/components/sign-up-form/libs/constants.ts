import { type UserSignUpRequestDto } from "@knowledgeprism/types";

const DEFAULT_SIGN_UP_PAYLOAD: UserSignUpRequestDto = {
	agreeToTerms: false,
	email: "",
	password: "",
};

export { DEFAULT_SIGN_UP_PAYLOAD };
