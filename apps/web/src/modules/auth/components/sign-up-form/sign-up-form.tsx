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
			<div className="flex flex-col gap-2">
				<Heading level={2}>Create your account</Heading>
				<Paragraph size={ParagraphSize.BODY_SMALL}>
					Start building your knowledge graph.
				</Paragraph>
			</div>
			<form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
				<Input
					control={control}
					label="Organisation name"
					name="organisationName"
					placeholder="Acme Inc."
				/>
				<Input
					control={control}
					label="First name"
					name="firstName"
					placeholder="Sarah"
				/>
				<Input
					control={control}
					label="Last name"
					name="lastName"
					placeholder="Johnson"
				/>
				<Input
					control={control}
					label="Email"
					name="email"
					placeholder="you@company.com"
					type="email"
				/>
				<Input
					control={control}
					label="Password"
					name="password"
					placeholder="At least 8 characters"
					type="password"
				/>
				<Input
					control={control}
					label="Confirm password"
					name="confirmPassword"
					placeholder="Repeat your password"
					type="password"
				/>
				<Checkbox
					control={control}
					label={
						<span>
							I agree to the{" "}
							<a className="underline" href="/terms">
								Terms
							</a>{" "}
							and{" "}
							<a className="underline" href="/privacy">
								Privacy Policy
							</a>
						</span>
					}
					name="agreeToTerms"
				/>
				<Button className="w-full" type="submit">
					Create Account
				</Button>
			</form>
		</>
	);
};

export { SignUpForm };
