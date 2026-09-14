import { UserValidationRule } from "@knowledgeprism/constants";
import { userUpdateValidationSchema } from "@knowledgeprism/schemas";
import { useParams } from "react-router-dom";
import { z } from "zod";

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

const frontendUpdateSchema = userUpdateValidationSchema.extend({
	isActive: z.boolean().optional(),
	password: z
		.string()
		.min(UserValidationRule.PASSWORD_MINIMUM_LENGTH)
		.max(UserValidationRule.PASSWORD_MAXIMUM_LENGTH)
		.optional()
		.or(z.literal("")),
});

type UserEditFormValues = {
	email: string;
	firstName: string;
	isActive?: boolean;
	lastName: string;
	password?: string;
};

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
			email: "",
			firstName: "",
			isActive: true,
			lastName: "",
			password: "",
		},
		validationSchema: frontendUpdateSchema,
	});

	useEffect(() => {
		if (selectedUser) {
			reset({
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
