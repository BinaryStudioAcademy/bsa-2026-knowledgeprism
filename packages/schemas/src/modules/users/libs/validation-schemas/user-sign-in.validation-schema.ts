import { z } from "zod";

import { email } from "./email.validation-schema.js";

const userSignIn = z.object({
	email,
	password: z.string().nonempty("Password is required."),
});

export { userSignIn };
