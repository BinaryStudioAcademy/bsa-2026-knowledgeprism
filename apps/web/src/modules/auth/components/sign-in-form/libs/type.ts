import { UserSignInRequestDto } from "@knowledgeprism/types";

type SignInFormValues = UserSignInRequestDto & {
	rememberMe: boolean;
};
export { type SignInFormValues };
