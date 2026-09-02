import reactLogo from "~/assets/img/react.svg";
import { Button, Link, Modal, RouterOutlet } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useEffect,
	useLocation,
	useNavigate,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { actions as userActions } from "~/modules/users/users.js";

const App: React.FC = () => {
	const { pathname, search } = useLocation();
	const navigate = useNavigate();
	const dispatch = useAppDispatch();

	const { dataStatus, users } = useAppSelector(({ users }) => ({
		dataStatus: users.dataStatus,
		users: users.users,
	}));

	const isRoot = pathname === AppRoute.ROOT;
	const isModalOpen = new URLSearchParams(search).get("modal") === "true";

	const handleModal = (): void => {
		const nextSearchParams = new URLSearchParams(search);

		if (isModalOpen) {
			nextSearchParams.delete("modal");
		} else {
			nextSearchParams.set("modal", "true");
		}

		const nextSearch = nextSearchParams.toString();

		void navigate(
			{
				pathname,
				search: nextSearch ? `?${nextSearch}` : "",
			},
			{ replace: true },
		);
	};

	useEffect(() => {
		if (isRoot) {
			void dispatch(userActions.loadAll());
		}
	}, [dispatch, isRoot]);

	const renderUsers = (): React.ReactNode[] =>
		users.map((user) => <li key={user.id}>{user.email}</li>);

	return (
		<>
			<img alt="logo" className="App-logo" src={reactLogo} width="30" />

			<ul className="App-navigation-list">
				<li>
					<Link to={AppRoute.ROOT}>Root</Link>
				</li>
				<li>
					<Link to={AppRoute.SIGN_IN}>Sign in</Link>
				</li>
				<li>
					<Link to={AppRoute.SIGN_UP}>Sign up</Link>
				</li>
			</ul>

			<p>Current path: {pathname}</p>

			<div>
				<RouterOutlet />
			</div>
			<div
				style={{ display: "flex", justifyContent: "center", marginTop: "20px" }}
			>
				<Button onClick={handleModal} variant="primary">
					Open modal
				</Button>
			</div>

			<Modal isOpen={isModalOpen} onClose={handleModal} title="Add knowledge">
				<p className="modal__description">
					Add a new knowledge item to the workspace and continue with the
					validation flow.
				</p>

				<div className="modal__actions">
					<Button onClick={handleModal} variant="secondary">
						Cancel
					</Button>
					<Button onClick={handleModal} variant="primary">
						Add
					</Button>
				</div>
			</Modal>

			{isRoot && (
				<>
					<h2>Users:</h2>
					<h3>Status: {dataStatus}</h3>
					<ul>{renderUsers()}</ul>
				</>
			)}
		</>
	);
};

export { App };
