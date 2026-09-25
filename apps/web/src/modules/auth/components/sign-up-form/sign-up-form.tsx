import { UserValidationMessage } from "@knowledgeprism/constants";
import { type UserSignUpRequestDto } from "@knowledgeprism/types";

import {
	Button,
	Checkbox,
	Heading,
	Input,
	Link,
	Modal,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import {
	privacyPolicy,
	TermsOfServices,
} from "~/components/footer/data/data.js";
import { useAppForm, useCallback, useState } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/app-route.enum.js";

import { DEFAULT_SIGN_UP_PAYLOAD } from "./libs/constants.js";
import { type SignUpFormValues } from "./libs/types.js";
import { signUpFormValidationSchema } from "./libs/validation-schema.js";

type LegalDocument = "privacy" | "terms" | null;

type Properties = {
	onSubmit: (payload: UserSignUpRequestDto) => void;
};

const SECTION_NUMBER_OFFSET = 1;

const DOCUMENT_CONTENT = {
	privacy: {
		sections: privacyPolicy,
		title: "Privacy Policy",
	},
	terms: {
		sections: TermsOfServices,
		title: "Terms of Service",
	},
} as const;

const SignUpForm = ({ onSubmit }: Properties): React.JSX.Element => {
	const [openDocument, setOpenDocument] = useState<LegalDocument>(null);
	const { control, handleSubmit } = useAppForm<SignUpFormValues>({
		defaultValues: DEFAULT_SIGN_UP_PAYLOAD,
		validationSchema: signUpFormValidationSchema,
	});

	const isModalOpen = openDocument !== null;
	const activeDocument = openDocument ?? "privacy";
	const { sections, title } = DOCUMENT_CONTENT[activeDocument];

	const handleOpenDocument = useCallback(
		(document: Exclude<LegalDocument, null>) =>
			(event_: React.MouseEvent): void => {
				event_.preventDefault();
				event_.stopPropagation();
				setOpenDocument(document);
			},
		[],
	);

	const handleCloseModal = useCallback((): void => {
		setOpenDocument(null);
	}, []);

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
				<Heading level="2">Create your organisation</Heading>
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
					hasPasswordToggle
					hintInfo={UserValidationMessage.PASSWORD_HINT}
					label="Password"
					name="password"
					placeholder="At least 8 characters"
					type="password"
				/>
				<Input
					control={control}
					hasPasswordToggle
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
							<button
								className="cursor-pointer underline hover:text-accent focus:outline-none"
								onClick={handleOpenDocument("terms")}
								type="button"
							>
								Terms
							</button>{" "}
							and{" "}
							<button
								className="cursor-pointer underline hover:text-accent focus:outline-none"
								onClick={handleOpenDocument("privacy")}
								type="button"
							>
								Privacy Policy
							</button>
						</span>
					}
					name="agreeToTerms"
				/>
				<Button className="w-full" type="submit">
					Create organisation
				</Button>
			</form>
			<Paragraph
				className="pt-2 w-full text-center"
				size={ParagraphSize.BODY_SMALL}
			>
				Already have an account?{" "}
				<Link to={AppRoute.SIGN_IN} variant="inline">
					Log in
				</Link>
			</Paragraph>
			<Modal
				hasCloseButton
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				size="large"
				title={title}
			>
				<div className="flex max-h-140 flex-col">
					<div className="flex flex-col gap-4 overflow-y-auto">
						{sections.map(({ answer, title: sectionTitle }, index) => (
							<section className="mb-2" key={sectionTitle}>
								<h3 className="mb-2 font-sans text-base font-medium">
									{index + SECTION_NUMBER_OFFSET}. {sectionTitle}
								</h3>
								<p className="text-sm leading-6 text-text-muted">{answer}</p>
							</section>
						))}
					</div>

					<div className="-mx-7 flex items-end justify-end border-t border-gray-300 bg-surface px-7 pt-4">
						<Button onClick={handleCloseModal} variant="primary">
							Close
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
};

export { SignUpForm };
