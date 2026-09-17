import { useParams } from "react-router-dom";

import {
	Heading,
	Loader,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import {
	useAppDispatch,
	useAppForm,
	useAppSelector,
	useCallback,
	useEffect,
	useNavigate,
	useState,
} from "~/hooks/hooks.js";
import { AppRoute, DataStatus } from "~/lib/enums/enums.js";
import { actions as userActions } from "~/modules/users/users.js";

import { UserForm } from "../user-form/user-form.js";
import { userUpdateFrontendValidationSchema } from "./libs/validation-schemas.js";

type ProjectRole = "EDITOR" | "VIEWER";

type UserEditFormValues = {
	assignedProjects: { projectId: number; role: ProjectRole }[];
	email: string;
	firstName: string;
	isActive?: boolean;
	lastName: string;
	password?: string;
};

// NOTE: Projects are currently mocked. When GET /projects endpoint is implemented, this should consume actual project data.
const MOCKED_PROJECTS = [
	{ id: 1, name: "Knowledge Base Alpha" },
	{ id: 2, name: "Marketing Site" },
];

const UserEditPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const { id } = useParams<{ id: string }>();
	const [errorMessage, setErrorMessage] = useState<string | undefined>();

	const { currentUser, selectedUser, selectedUserStatus } = useAppSelector(
		({ auth, users }) => ({
			currentUser: auth.user,
			selectedUser: users.selectedUser,
			selectedUserStatus: users.selectedUserStatus,
		}),
	);

	const userId = Number(id);

	useEffect(() => {
		if (userId && !Number.isNaN(userId)) {
			void dispatch(userActions.loadUserById(userId));
		}
	}, [dispatch, userId]);

	const { control, handleSubmit, reset } = useAppForm<UserEditFormValues>({
		defaultValues: {
			assignedProjects: [],
			email: "",
			firstName: "",
			isActive: true,
			lastName: "",
			password: "",
		},
		validationSchema: userUpdateFrontendValidationSchema,
	});

	useEffect(() => {
		if (selectedUser) {
			reset({
				assignedProjects: selectedUser.assignedProjects as {
					projectId: number;
					role: ProjectRole;
				}[],
				email: selectedUser.email,
				firstName: selectedUser.firstName ?? "",
				isActive: selectedUser.status === "active",
				lastName: selectedUser.lastName ?? "",
				password: "",
			});
		}
	}, [selectedUser, reset]);

	const handleValidSubmit = useCallback(
		(values: UserEditFormValues): void => {
			setErrorMessage(undefined);

			void dispatch(
				userActions.updateUser({
					id: userId,
					payload: {
						assignedProjects: values.assignedProjects,
						email: values.email,
						firstName: values.firstName,
						lastName: values.lastName,
						status:
							(values.isActive ?? selectedUser?.status === "active")
								? "active"
								: "inactive",
						...(values.password && { password: values.password }),
					},
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
		[dispatch, navigate, userId, selectedUser],
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

	const isAdminEditingSelf = currentUser?.user.id === userId;

	return (
		<div className="relative flex flex-1 justify-center overflow-auto p-4 tablet:p-7 desktop:px-11 desktop:py-10">
			<div className="flex w-full flex-col gap-3.5 tablet:w-130 tablet:gap-4.5 desktop:w-160 desktop:gap-6">
				<div>
					<Heading level="2">Edit User</Heading>
					<Paragraph
						className="mt-1.5 hidden text-text-muted desktop:block"
						size={ParagraphSize.BODY_SMALL}
					>
						Update user details and their access levels.
					</Paragraph>
				</div>

				{selectedUserStatus === DataStatus.PENDING && <Loader />}

				{selectedUserStatus === DataStatus.FULFILLED && selectedUser && (
					<UserForm
						availableProjects={MOCKED_PROJECTS}
						control={control}
						errorMessage={errorMessage}
						isAdmin={isAdminEditingSelf}
						isEditMode={true}
						onCancel={handleCancel}
						onSubmit={handleFormSubmit}
					/>
				)}
			</div>
		</div>
	);
};

export { UserEditPage };
