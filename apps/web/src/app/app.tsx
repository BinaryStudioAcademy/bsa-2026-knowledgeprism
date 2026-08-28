import { useState } from "react";

import reactLogo from "~/assets/img/react.svg";
import { Button, Link, Modal, RouterOutlet } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useEffect,
	useLocation,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { actions as userActions } from "~/modules/users/users.js";

const App: React.FC = () => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const { pathname } = useLocation();
	const dispatch = useAppDispatch();
	const { dataStatus, users } = useAppSelector(({ users }) => ({
		dataStatus: users.dataStatus,
		users: users.users,
	}));

	const isRoot = pathname === AppRoute.ROOT;

	useEffect(() => {
		if (isRoot) {
			void dispatch(userActions.loadAll());
		}
	}, [isRoot, dispatch]);

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

			<div className="demo-action-row">
				<Button
					className="demo-action-button"
					onClick={() => setIsModalOpen(true)}
					variant="primary"
				>
					Open modal
				</Button>
			</div>

			<Modal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				title="Add knowledge"
			>
				<p className="modal__description">
					Add a new knowledge item to the workspace and continue with the
					validation flow.
				</p>

				<div className="modal__actions">
					<Button onClick={() => setIsModalOpen(false)} variant="secondary">
						Cancel
					</Button>
					<Button onClick={() => setIsModalOpen(false)} variant="primary">
						Add
					</Button>
				</div>
			</Modal>

			{isRoot && (
				<>
					<h2>Users:</h2>
					<h3>Status: {dataStatus}</h3>
					<ul>
						{users.map((user) => (
							<li key={user.id}>{user.email}</li>
						))}
					</ul>
				</>
			)}
		</>
	);
};

export { App };
