import { Heading, Paragraph, ParagraphSize } from "~/components/components.js";
import {
	useAppDispatch,
	useAppForm,
	useAppSelector,
	useCallback,
	useEffect,
	useNavigate,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { actions as projectsActions } from "~/modules/projects/projects.js";
import { actions as userActions } from "~/modules/users/users.js";

import { UserForm } from "../user-form/user-form.js";
import { userCreateFrontendValidationSchema } from "./libs/validation-schema.js";

type ProjectRole = "EDITOR" | "VIEWER";

type UserCreationFormValues = {
	assignedProjects: { projectId: number; role: ProjectRole }[];
	confirmPassword: string;
	email: string;
	firstName: string;
	lastName: string;
	password?: string;
};

const DEFAULT_USER_CREATION_PAYLOAD: UserCreationFormValues = {
	assignedProjects: [],
	confirmPassword: "",
	email: "",
	firstName: "",
	lastName: "",
	password: "",
};

const UserCreationPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const availableProjects = useAppSelector((state) => state.projects.projects);

	useEffect(() => {
		void dispatch(projectsActions.loadAllProjects());
	}, [dispatch]);

	const { control, handleSubmit } = useAppForm<UserCreationFormValues>({
		defaultValues: DEFAULT_USER_CREATION_PAYLOAD,
		validationSchema: userCreateFrontendValidationSchema,
	});

	const handleValidSubmit = useCallback(
		(values: UserCreationFormValues): void => {
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
				.catch(() => {});
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
					availableProjects={availableProjects}
					control={control}
					onCancel={handleCancel}
					onSubmit={handleFormSubmit}
				/>
			</div>
		</div>
	);
};

export { UserCreationPage };
