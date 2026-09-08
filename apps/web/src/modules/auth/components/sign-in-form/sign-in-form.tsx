import { UserSignInRequestDto } from "@knowledgeprism/types";

import {
	Button,
	Checkbox,
	Heading,
	Input,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { useAppForm, useCallback } from "~/hooks/hooks.js";

import { DEFAULT_SIGN_IN_PAYLOAD } from "./libs/constant.js";
import { SignInFormValues } from "./libs/type.js";
import { signInFormValidationSchema } from "./libs/validation-schema.js";

type Properties = {
	onSubmit: (values: UserSignInRequestDto) => void;
};

const SignInForm = ({ onSubmit }: Properties) => {
	const { control, handleSubmit } = useAppForm<SignInFormValues>({
		defaultValues: DEFAULT_SIGN_IN_PAYLOAD,
		validationSchema: signInFormValidationSchema,
	});

	const handleValidSubmit = useCallback(
		(values: SignInFormValues): void => {
			onSubmit({
				email: values.email,
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
			<div>
				<Heading level={2}>Welcome back</Heading>
				<Paragraph className="pt-2" size={ParagraphSize.BODY_SMALL}>
					Sign in to continue to your workspace.
				</Paragraph>
			</div>
			<form className="flex flex-col gap-4" onSubmit={handleFormSubmit}>
				<Input
					control={control}
					label="Email"
					name="email"
					placeholder="you@company.com"
				/>
				<Input
					control={control}
					label="Password"
					name="password"
					placeholder="Enter your password"
					type="password"
				/>
				<div className="flex justify-between">
					<Checkbox
						control={control}
						label={
							<Paragraph size={ParagraphSize.BODY_SMALL}>Remember me</Paragraph>
						}
						name="rememberMe"
					/>
					<Paragraph
						className="text-accent! cursor-pointer"
						size={ParagraphSize.BODY_SMALL}
					>
						Forgot password?
					</Paragraph>
				</div>
				<Button type="submit">Sign in</Button>
			</form>
		</>
	);
};

export { SignInForm };
