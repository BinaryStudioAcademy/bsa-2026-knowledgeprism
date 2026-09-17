import { userCreateValidationSchema } from "@knowledgeprism/schemas";

import { Heading, Paragraph, ParagraphSize } from "~/components/components.js";
import {
	useAppDispatch,
	useAppForm,
	useCallback,
	useNavigate,
	useState,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { actions as userActions } from "~/modules/users/users.js";

import { UserForm } from "../user-form/user-form.js";

type ProjectRole = "EDITOR" | "VIEWER";

// TODO: Import real schema when available, for now using basic typing
type UserCreationFormValues = {
	assignedProjects: { projectId: number; role: ProjectRole }[];
	email: string;
	firstName: string;
	lastName: string;
	password?: string;
};

const DEFAULT_USER_CREATION_PAYLOAD: UserCreationFormValues = {
	assignedProjects: [],
	email: "",
	firstName: "",
	lastName: "",
	password: "",
};

// NOTE: Projects are currently mocked. When GET /projects endpoint is implemented, this should consume actual project data.
const MOCKED_PROJECTS = [
	{ id: 1, name: "Knowledge Base Alpha" },
	{ id: 2, name: "Marketing Site" },
];

const UserCreationPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const { control, handleSubmit } = useAppForm<UserCreationFormValues>({
		defaultValues: DEFAULT_USER_CREATION_PAYLOAD,
		validationSchema: userCreateValidationSchema,
	});

	const handleValidSubmit = useCallback(
		(values: UserCreationFormValues): void => {
			setErrorMessage(undefined);
			void dispatch(
				userActions.createUser({
					assignedProjects: values.assignedProjects,
					email: values.email,
					firstName: values.firstName,
					lastName: values.lastName,
					password: values.password ?? "",
				}),
			)
				.unwrap()
				.then(() => {
					void navigate(AppRoute.USERS);
				})
				.catch((error: unknown) => {
					const message =
						(error as { message?: string }).message ??
						"An unexpected error occurred";
					setErrorMessage(message);
				});
		},
		[dispatch, navigate],
	);

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	const handleCancel = useCallback((): void => {
		void navigate(AppRoute.USERS);
	}, [navigate]);

	return (
		<div className="relative flex flex-1 justify-center overflow-auto p-4 tablet:p-7 desktop:px-11 desktop:py-10">
			<div className="flex w-full flex-col gap-3.5 tablet:w-130 tablet:gap-4.5 desktop:w-160 desktop:gap-6">
				<div>
					<Heading level="2">Add New User</Heading>
					<Paragraph
						className="mt-1.5 hidden text-text-muted desktop:block"
						size={ParagraphSize.BODY_SMALL}
					>
						Invite a new member to the organisation.
					</Paragraph>
				</div>

				<UserForm
					availableProjects={MOCKED_PROJECTS}
					control={control}
					errorMessage={errorMessage}
					onCancel={handleCancel}
					onSubmit={handleFormSubmit}
				/>
			</div>
		</div>
	);
};

export { UserCreationPage };
