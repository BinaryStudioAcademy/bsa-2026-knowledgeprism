import {
	UserValidationMessage,
	UserValidationRule,
} from "@knowledgeprism/constants";
import { z } from "zod";

const email = z
	.string()
	.trim()
	.min(UserValidationRule.EMAIL_MINIMUM_LENGTH, {
		error: UserValidationMessage.EMAIL_REQUIRE,
	})
	.max(UserValidationRule.EMAIL_MAXIMUM_LENGTH, {
		error: UserValidationMessage.EMAIL_WRONG,
	})
	.pipe(
		z.email({
			error: UserValidationMessage.EMAIL_WRONG,
		}),
	);

export { email };
