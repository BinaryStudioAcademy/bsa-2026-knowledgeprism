import { OrganisationRole } from "@knowledgeprism/constants";

import {
	Avatar,
	Button,
	Heading,
	Loader,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCallback,
	useEffect,
	useNavigate,
} from "~/hooks/hooks.js";
import { AppRoute, DataStatus } from "~/lib/enums/enums.js";
import { actions as userActions } from "~/modules/users/users.js";
import { fetchProjects } from "~/modules/workspaces/state/workspaces.slice.js";
import { workspacesApi } from "~/modules/workspaces/workspaces.js";

const EMPTY_LENGTH = 0;
const UserManagementHubPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const currentUser = useAppSelector(({ auth }) => auth.user);
	const dataStatus = useAppSelector(({ users }) => users.dataStatus);
	const users = useAppSelector(({ users }) => users.users);

	const {
		error: projectsError,
		isLoading: isProjectsLoading,
		projects,
	} = useAppSelector(({ workspaces }) => workspaces);

	useEffect(() => {
		void dispatch(userActions.loadAll());
	}, [dispatch]);

	useEffect(() => {
		if (projects.length === EMPTY_LENGTH) {
			void dispatch(fetchProjects(workspacesApi));
		}
	}, [dispatch, projects.length]);

	const handleAddUserClick = useCallback((): void => {
		void navigate(AppRoute.USERS_NEW);
	}, [navigate]);

	const handleUserClick = useCallback(
		(event_: React.MouseEvent<HTMLTableRowElement>): void => {
			const id = event_.currentTarget.dataset["id"];

			if (id) {
				void navigate(AppRoute.USERS_EDIT.split(":id").join(id));
			}
		},
		[navigate],
	);

	const renderProjectsCount = useCallback(
		(user: (typeof users)[number]): React.ReactElement => {
			const isCurrentUserAdmin =
				currentUser?.user.organisationRole === OrganisationRole.ADMIN;
			const isUserAdmin =
				user.id === currentUser?.user.id
					? isCurrentUserAdmin
					: (user as { organisationRole?: string }).organisationRole ===
						OrganisationRole.ADMIN;

			if (!isUserAdmin) {
				return <span>{String(user.assignedProjects.length)} Projects</span>;
			}

			if (isProjectsLoading) {
				return <span className="text-text-muted">Loading...</span>;
			}

			if (projectsError) {
				return <span className="font-semibold text-error-hover">—</span>;
			}

			return <span>{String(projects.length)} Projects</span>;
		},
		[currentUser, isProjectsLoading, projects.length, projectsError],
	);

	return (
		<div className="relative flex flex-1 justify-center overflow-auto p-4 tablet:p-7 desktop:px-11 desktop:py-10">
			<div className="flex w-full max-w-5xl flex-col gap-3.5 tablet:gap-4.5 desktop:gap-6">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<Heading level="2">User Management</Heading>
						<Paragraph
							className="mt-1.5 hidden text-text-muted desktop:block"
							size={ParagraphSize.BODY_SMALL}
						>
							Manage users and their access levels within the organisation.
						</Paragraph>
					</div>
					<Button onClick={handleAddUserClick}>Add new user</Button>
				</div>

				{dataStatus === DataStatus.PENDING && <Loader />}

				{dataStatus === DataStatus.FULFILLED && (
					<div className="overflow-x-auto rounded-lg border border-border bg-surface">
						<table className="w-full table-fixed text-left font-sans text-sm">
							<thead className="border-b border-border bg-bg-subtle text-text-muted">
								<tr>
									<th className="px-4 py-3 font-medium">User</th>
									<th className="hidden w-32 px-4 py-3 font-medium sm:table-cell">
										Status
									</th>
									<th className="hidden w-32 px-4 py-3 font-medium sm:table-cell">
										Total
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-border">
								{users.map((user) => {
									return (
										<tr
											className="cursor-pointer transition-colors hover:bg-bg-subtle"
											data-id={user.id}
											key={user.id}
											onClick={handleUserClick}
										>
											<td className="px-4 py-3">
												<div className="flex items-center gap-3">
													<Avatar
														alt={`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()}
														initials={(() => {
															const FIRST_CHARACTER_INDEX = 0;

															return (
																user.firstName?.[FIRST_CHARACTER_INDEX] ??
																user.email.charAt(FIRST_CHARACTER_INDEX)
															).toUpperCase();
														})()}
													/>
													<div className="min-w-0 flex-1">
														<div className="hidden truncate font-medium text-text tablet:block">
															{user.firstName} {user.lastName}
														</div>
														<div className="flex flex-col font-medium text-text tablet:hidden">
															<span className="truncate">{user.firstName}</span>
															<span className="truncate">{user.lastName}</span>
														</div>
														<div className="truncate text-xs text-text-muted">
															{user.email}
														</div>
														<div className="mt-1 flex items-center gap-2 sm:hidden">
															{user.status === "active" ? (
																<span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-2xs font-medium leading-none text-green-800">
																	Active
																</span>
															) : (
																<span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-2xs font-medium leading-none text-gray-800">
																	Inactive
																</span>
															)}
															<span className="text-xs text-text-muted">
																&bull; {renderProjectsCount(user)}
															</span>
														</div>
													</div>
												</div>
											</td>
											<td className="hidden px-4 py-3 sm:table-cell">
												{user.status === "active" ? (
													<span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
														Active
													</span>
												) : (
													<span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
														Inactive
													</span>
												)}
											</td>
											<td className="hidden w-32 px-4 py-3 text-text-muted sm:table-cell">
												<span className="inline-block min-w-20">
													{renderProjectsCount(user)}
												</span>
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};

export { UserManagementHubPage };
