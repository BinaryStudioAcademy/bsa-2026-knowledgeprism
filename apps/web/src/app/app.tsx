import { useAppDispatch, useAppSelector, useEffect } from "~/hooks/hooks.js";
import { actions as userActions } from "~/modules/users/users.js";

const App: React.FC = () => {
	const dispatch = useAppDispatch();
	const dataStatus = useAppSelector((state) => state.users.dataStatus);
	const users = useAppSelector((state) => state.users.users);

	useEffect(() => {
		void dispatch(userActions.loadAll());
	}, [dispatch]);

	return (
		<>
			<h2>Users:</h2>
			<h3>Status: {dataStatus}</h3>

			<ul>
				{users.map((user) => (
					<li key={user.id}>{user.email}</li>
				))}
			</ul>
		</>
	);
};

export { App };
