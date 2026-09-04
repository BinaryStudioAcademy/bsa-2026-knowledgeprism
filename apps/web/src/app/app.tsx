import { useCallback } from "react";

import { Link, Logo, RouterOutlet } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useEffect,
	useLocation,
	useNavigate,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { actions as authActions } from "~/modules/auth/auth.js";
import { actions as userActions } from "~/modules/users/users.js";

const App: React.FC = () => {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();
	const { dataStatus, user, users } = useAppSelector(({ auth, users }) => ({
		dataStatus: users.dataStatus,
		user: auth.user,
		users: users.users,
	}));

	const hasUser = Boolean(user);
	const isRoot = pathname === AppRoute.ROOT;

	const handleLogout = useCallback((): void => {
		void dispatch(authActions.logout());
		void navigate(AppRoute.ROOT);
	}, [dispatch, navigate]);

	useEffect(() => {
		if (isRoot) {
			void dispatch(userActions.loadAll());
		}
	}, [isRoot, dispatch]);

	return (
		<>
			<Logo to={AppRoute.ROOT} />

			<ul className="App-navigation-list">
				<li>
					<Link to={AppRoute.ROOT}>Root</Link>
				</li>
				{hasUser ? (
					<li>
						<button
							className="cursor-pointer font-medium text-red-600 hover:underline"
							onClick={handleLogout}
							type="button"
						>
							Log out ({user?.email})
						</button>
					</li>
				) : (
					<>
						<li>
							<Link to={AppRoute.SIGN_IN}>Sign in</Link>
						</li>
						<li>
							<Link to={AppRoute.SIGN_UP}>Sign up</Link>
						</li>
					</>
				)}
			</ul>
			<p>Current path: {pathname}</p>

			<div>
				<RouterOutlet />
			</div>
			{isRoot && (
				<>
					<h2>Users:</h2>
					<h3>Status: {dataStatus}</h3>
					<ul>
						{users.map((userItem) => (
							<li key={userItem.id}>{userItem.email}</li>
						))}
					</ul>
				</>
			)}
		</>
	);
};

export { App };
