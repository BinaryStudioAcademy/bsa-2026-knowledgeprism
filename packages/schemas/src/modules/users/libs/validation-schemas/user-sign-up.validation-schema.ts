import { z } from "zod";

import { email } from "./email.validation-schema.js";

const userSignUp = z
	.object({
		email,
		password: z.string().trim(),
	})
	.required();

export { userSignUp };
