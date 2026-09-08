import { type SignUpFormValues } from "./types.js";

const DEFAULT_SIGN_UP_PAYLOAD: SignUpFormValues = {
	agreeToTerms: false,
	confirmPassword: "",
	email: "",
	firstName: "",
	lastName: "",
	organisationName: "",
	password: "",
};

export { DEFAULT_SIGN_UP_PAYLOAD };
