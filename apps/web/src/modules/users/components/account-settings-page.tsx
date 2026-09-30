import { UserStatus } from "@knowledgeprism/constants";
import {
	type ProjectAssignmentDto,
	type UserDetailsResponseDto,
} from "@knowledgeprism/types";

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
} from "~/hooks/hooks.js";
import { AppRoute, DataStatus } from "~/lib/enums/enums.js";
import { actions as projectsActions } from "~/modules/projects/projects.js";
import { actions as userActions } from "~/modules/users/users.js";

import { userUpdateFrontendValidationSchema } from "./user-edit-page/libs/validation-schemas.js";
import { UserForm } from "./user-form/user-form.js";

type AccountSettingsFormValues = {
	assignedProjects: ProjectAssignmentDto[];
	confirmPassword?: string;
	email: string;
	firstName: string;
	isActive?: boolean;
	lastName: string;
	password?: string;
};

const getFormValues = (
	user: UserDetailsResponseDto,
): AccountSettingsFormValues => ({
	assignedProjects: user.assignedProjects,
	confirmPassword: "",
	email: user.email,
	firstName: user.firstName ?? "",
	isActive: user.status === UserStatus.ACTIVE,
	lastName: user.lastName ?? "",
	password: "",
});

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

	const { control, handleSubmit, isDirty, reset } =
		useAppForm<AccountSettingsFormValues>({
			defaultValues: {
				assignedProjects: [],
				confirmPassword: "",
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
			reset(getFormValues(selectedUser));
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
				.then((updatedUser) => {
					reset(getFormValues(updatedUser));
				})
				.catch(() => {});
		},
		[dispatch, currentUserId, reset],
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
		<div className="relative flex flex-1 justify-center overflow-auto p-4 tablet:p-7 desktop:px-11 desktop:py-10">
			<div className="flex w-full flex-col gap-3.5 tablet:w-130 tablet:gap-4.5 desktop:w-160 desktop:gap-6">
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
						isSubmitDisabled={!isDirty}
						onCancel={handleCancel}
						onSubmit={handleFormSubmit}
					/>
				)}
			</div>
		</div>
	);
};

export { AccountSettingsPage };
