import { ProjectMemberRole } from "@knowledgeprism/constants";

import { Heading, Paragraph, ParagraphSize } from "~/components/components.js";
import {
	useAppDispatch,
	useAppForm,
	useAppSelector,
	useCallback,
	useEffect,
	useLocation,
	useNavigate,
} from "~/hooks/hooks.js";
import { actions as projectsActions } from "~/modules/projects/projects.js";
import {
	buildUserManagementPath,
	getUserManagementProjectId,
} from "~/modules/users/libs/helpers/user-management-project.helper.js";
import { type AssignableProjectRole } from "~/modules/users/libs/types/assignable-project-role.type.js";
import { actions as userActions } from "~/modules/users/users.js";

import { UserForm } from "../user-form/user-form.js";
import { userCreateFrontendValidationSchema } from "./libs/validation-schema.js";

type UserCreationFormValues = {
	assignedProjects: { projectId: number; role: AssignableProjectRole }[];
	confirmPassword: string;
	email: string;
	firstName: string;
	lastName: string;
	password?: string;
};

const DEFAULT_PROJECT_ROLE: AssignableProjectRole = ProjectMemberRole.VIEWER;
const MINIMUM_PROJECT_ID = 1;

const toProjectId = (projectId: null | string): null | number => {
	if (!projectId) {
		return null;
	}

	const parsed = Number(projectId);

	if (!Number.isInteger(parsed) || parsed < MINIMUM_PROJECT_ID) {
		return null;
	}

	return parsed;
};

const withLockedProject = (
	assignedProjects: UserCreationFormValues["assignedProjects"],
	projectId: null | number,
): UserCreationFormValues["assignedProjects"] => {
	if (projectId === null) {
		return assignedProjects;
	}

	const isAlreadyAssigned = assignedProjects.some((assignment) => {
		return assignment.projectId === projectId;
	});

	if (isAlreadyAssigned) {
		return assignedProjects;
	}

	return [{ projectId, role: DEFAULT_PROJECT_ROLE }, ...assignedProjects];
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
	const { search } = useLocation();
	const selectedProjectId = getUserManagementProjectId(search);
	const lockedProjectId = toProjectId(selectedProjectId);
	const returnPath = buildUserManagementPath(selectedProjectId);
	const availableProjects = useAppSelector((state) => state.projects.projects);

	useEffect(() => {
		void dispatch(projectsActions.loadAllProjects());
	}, [dispatch]);

	const { control, handleSubmit } = useAppForm<UserCreationFormValues>({
		defaultValues:
			lockedProjectId === null
				? DEFAULT_USER_CREATION_PAYLOAD
				: {
						...DEFAULT_USER_CREATION_PAYLOAD,
						assignedProjects: [
							{ projectId: lockedProjectId, role: DEFAULT_PROJECT_ROLE },
						],
					},
		validationSchema: userCreateFrontendValidationSchema,
	});

	const handleValidSubmit = useCallback(
		(values: UserCreationFormValues): void => {
			const assignedProjects = withLockedProject(
				values.assignedProjects,
				lockedProjectId,
			);

			void dispatch(
				userActions.createUser({
					assignedProjects,
					email: values.email,
					firstName: values.firstName,
					lastName: values.lastName,
					password: values.password ?? "",
				}),
			)
				.unwrap()
				.then(() => {
					void navigate(returnPath);
				})
				.catch(() => {});
		},
		[dispatch, lockedProjectId, navigate, returnPath],
	);

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	const handleCancel = useCallback((): void => {
		void navigate(returnPath);
	}, [navigate, returnPath]);

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
					{...(lockedProjectId === null ? {} : { lockedProjectId })}
					onCancel={handleCancel}
					onSubmit={handleFormSubmit}
				/>
			</div>
		</div>
	);
};

export { UserCreationPage };
