import { userSignUpValidationSchema } from "@knowledgeprism/schemas";
import { type UserSignUpRequestDto } from "@knowledgeprism/types";

import { Button, Checkbox, Input } from "~/components/components.js";
import { useAppForm, useCallback } from "~/hooks/hooks.js";

import { DEFAULT_SIGN_UP_PAYLOAD } from "./libs/constants.js";

type Properties = {
	onSubmit: (payload: UserSignUpRequestDto) => void;
};

const SignUpForm: React.FC<Properties> = ({ onSubmit }: Properties) => {
	const { control, handleSubmit } = useAppForm<UserSignUpRequestDto>({
		defaultValues: DEFAULT_SIGN_UP_PAYLOAD,
		validationSchema: userSignUpValidationSchema,
	});

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			void handleSubmit(onSubmit)(event_);
		},
		[handleSubmit, onSubmit],
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
