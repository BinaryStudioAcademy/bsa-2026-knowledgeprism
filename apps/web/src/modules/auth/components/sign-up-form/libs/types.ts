import { type UserSignUpRequestDto } from "@knowledgeprism/types";

type SignUpFormValues = UserSignUpRequestDto & {
	agreeToTerms: boolean;
	confirmPassword: string;
};

export { type SignUpFormValues };
