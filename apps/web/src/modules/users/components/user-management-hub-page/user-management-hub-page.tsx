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

const UserManagementHubPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();

	const dataStatus = useAppSelector(({ users }) => users.dataStatus);
	const users = useAppSelector(({ users }) => users.users);

	useEffect(() => {
		void dispatch(userActions.loadAll());
	}, [dispatch]);

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

	return (
		<div className="relative flex flex-1 justify-center overflow-auto p-4 tablet:p-7 desktop:px-11 desktop:py-10">
			<div className="flex w-full flex-col gap-3.5 tablet:w-130 tablet:gap-4.5 desktop:w-160 desktop:gap-6">
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
						<table className="w-full text-left font-sans text-sm">
							<thead className="border-b border-border bg-bg-subtle text-text-muted">
								<tr>
									<th className="px-4 py-3 font-medium">User</th>
									<th className="px-4 py-3 font-medium">Status</th>
									<th className="px-4 py-3 font-medium">Roles</th>
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
											<td className="flex items-center gap-3 px-4 py-3">
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
												<div>
													<div className="font-medium text-text">
														{user.firstName} {user.lastName}
													</div>
													<div className="text-xs text-text-muted">
														{user.email}
													</div>
												</div>
											</td>
											<td className="px-4 py-3">
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
											<td className="px-4 py-3 text-text-muted">
												{user.assignedProjects.length} Projects
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
