import { UserSignInRequestDto } from "@knowledgeprism/types";

import {
	Button,
	Checkbox,
	Heading,
	Input,
	Link,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { useAppForm, useCallback, useEffect } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/app-route.enum.js";

import { DEFAULT_SIGN_IN_PAYLOAD } from "./libs/constant.js";
import { SignInFormValues } from "./libs/type.js";
import { signInFormValidationSchema } from "./libs/validation-schema.js";

type Properties = {
	hasServerError?: boolean;
	isLoading?: boolean;
	onSubmit: (values: UserSignInRequestDto) => void;
};

const SignInForm = ({
	hasServerError = false,
	isLoading = false,
	onSubmit,
}: Properties) => {
	const { clearErrors, control, handleSubmit, setError } =
		useAppForm<SignInFormValues>({
			defaultValues: DEFAULT_SIGN_IN_PAYLOAD,
			validationSchema: signInFormValidationSchema,
		});

	useEffect(() => {
		if (!hasServerError) {
			clearErrors(["email", "password"]);
			return;
		}
		setError("email", { type: "server" });
		setError("password", { type: "server" });
	}, [clearErrors, hasServerError, setError]);

	const handleValidSubmit = useCallback(
		(values: SignInFormValues): void => {
			onSubmit({
				email: values.email,
				password: values.password,
				rememberMe: values.rememberMe,
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
				<Heading level="2">Welcome back</Heading>
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
					hasPasswordToggle
					label="Password"
					name="password"
					placeholder="Enter your password"
					type="password"
				/>
				<Checkbox
					control={control}
					label={
						<Paragraph size={ParagraphSize.BODY_SMALL}>Remember me</Paragraph>
					}
					name="rememberMe"
				/>

				<Button isLoading={isLoading} type="submit">
					Sign in
				</Button>
			</form>
			<Paragraph
				className="pt-2 w-full text-center"
				size={ParagraphSize.BODY_SMALL}
			>
				Don&apos;t have an account?{" "}
				<Link to={AppRoute.SIGN_UP} variant="inline">
					Sign up
				</Link>
			</Paragraph>
		</>
	);
};

export { SignInForm };
