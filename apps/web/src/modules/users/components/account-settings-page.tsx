import { UserStatus } from "@knowledgeprism/constants";
import { type ProjectAssignmentDto } from "@knowledgeprism/types";

import {
	Heading,
	Loader,
	PageLayout,
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
} from "~/hooks/hooks.js";
import { AppRoute, DataStatus } from "~/lib/enums/enums.js";
import { actions as projectsActions } from "~/modules/projects/projects.js";
import { actions as userActions } from "~/modules/users/users.js";

import { userUpdateFrontendValidationSchema } from "./user-edit-page/libs/validation-schemas.js";
import { UserForm } from "./user-form/user-form.js";

type AccountSettingsFormValues = {
	assignedProjects: ProjectAssignmentDto[];
	email: string;
	firstName: string;
	isActive?: boolean;
	lastName: string;
	password?: string;
};

const AccountSettingsPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const { availableProjects, currentUserId, selectedUser, selectedUserStatus } =
		useAppSelector(({ auth, projects, users }) => ({
			availableProjects: projects.projects,
			currentUserId: auth.user?.user.id,
			selectedUser: users.selectedUser,
			selectedUserStatus: users.selectedUserStatus,
		}));

	useEffect(() => {
		if (currentUserId) {
			void dispatch(userActions.loadUserById(currentUserId));
		}
		void dispatch(projectsActions.loadAllProjects());
	}, [dispatch, currentUserId]);

	const { control, handleSubmit, reset } =
		useAppForm<AccountSettingsFormValues>({
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
				assignedProjects: selectedUser.assignedProjects,
				email: selectedUser.email,
				firstName: selectedUser.firstName ?? "",
				isActive: selectedUser.status === UserStatus.ACTIVE,
				lastName: selectedUser.lastName ?? "",
				password: "",
			});
		}
	}, [selectedUser, reset]);

	const handleValidSubmit = useCallback(
		(values: AccountSettingsFormValues): void => {
			if (!currentUserId) {
				return;
			}

			void dispatch(
				userActions.updateUser({
					id: currentUserId,
					payload: {
						firstName: values.firstName,
						lastName: values.lastName,
						...(values.password && { password: values.password }),
					},
				}),
			)
				.unwrap()
				.catch(() => {});
		},
		[dispatch, currentUserId],
	);

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	const handleCancel = useCallback((): void => {
		void navigate(AppRoute.WORKSPACES);
	}, [navigate]);

	return (
		<PageLayout>
			<div>
				<Heading level="2">Account Settings</Heading>
				<Paragraph
					className="mt-1.5 hidden text-text-muted desktop:block"
					size={ParagraphSize.BODY_SMALL}
				>
					Manage your profile details.
				</Paragraph>
			</div>

			{selectedUserStatus === DataStatus.PENDING && <Loader />}

			{selectedUserStatus === DataStatus.FULFILLED && selectedUser && (
				<UserForm
					availableProjects={availableProjects}
					control={control}
					isEditMode={true}
					isReadOnly={true}
					onCancel={handleCancel}
					onSubmit={handleFormSubmit}
				/>
			)}
		</PageLayout>
	);
};

export { AccountSettingsPage };
