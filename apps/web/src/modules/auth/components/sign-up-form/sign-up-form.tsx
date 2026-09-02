import { type UserSignUpRequestDto } from "@knowledgeprism/types";

import {
	Button,
	Checkbox,
	Heading,
	Input,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { useAppForm, useCallback } from "~/hooks/hooks.js";

import { DEFAULT_SIGN_UP_PAYLOAD } from "./libs/constants.js";
import { type SignUpFormValues } from "./libs/types.js";
import { signUpFormValidationSchema } from "./libs/validation-schema.js";

type Properties = {
	onSubmit: (payload: UserSignUpRequestDto) => void;
};

const SignUpForm: React.FC<Properties> = ({ onSubmit }: Properties) => {
	const { control, handleSubmit } = useAppForm<SignUpFormValues>({
		defaultValues: DEFAULT_SIGN_UP_PAYLOAD,
		validationSchema: signUpFormValidationSchema,
	});

	const handleValidSubmit = useCallback(
		(values: SignUpFormValues): void => {
			onSubmit({
				email: values.email,
				firstName: values.firstName,
				lastName: values.lastName,
				organisationName: values.organisationName,
				password: values.password,
			});
		},
		[onSubmit],
	);

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	return (
		<>
			<h3>Sign Up</h3>
			<form onSubmit={handleFormSubmit}>
				<div>
					<Input
						control={control}
						label="Email"
						name="email"
						placeholder="Enter your email"
						type="text"
					/>
				</div>
				<div>
					<Input
						control={control}
						label="Password"
						name="password"
						placeholder="Enter your password"
						type="text"
					/>
				</div>
				<div>
					<Checkbox
						control={control}
						label={
							<span>
								I agree to the{" "}
								<a className="underline hover:opacity-80" href="/terms">
									Terms
								</a>{" "}
								and{" "}
								<a className="underline hover:opacity-80" href="/privacy">
									Privacy Policy
								</a>
							</span>
						}
						name="agreeToTerms"
					/>
				</div>
				<Button type="submit">Sign up</Button>
			</form>
		</>
	);
};

export { SignUpForm };
