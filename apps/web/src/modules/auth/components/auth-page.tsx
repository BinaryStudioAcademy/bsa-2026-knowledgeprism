import { type UserSignUpRequestDto } from "@knowledgeprism/types";

import {
	useAppDispatch,
	useAppSelector,
	useCallback,
	useLocation,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { actions as authActions } from "~/modules/auth/index.js";

import { SignInForm, SignUpForm } from "./components.js";

const AuthPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { dataStatus } = useAppSelector(({ auth }) => ({
		dataStatus: auth.dataStatus,
	}));
	const { pathname } = useLocation();

	const handleSignInSubmit = useCallback((): void => {
		// handle sign in
	}, []);

	const handleSignUpSubmit = useCallback(
		(payload: UserSignUpRequestDto): void => {
			void dispatch(authActions.signUp(payload));
		},
		[dispatch],
	);

	const getScreen = (screen: string): React.JSX.Element => {
		if (screen === AppRoute.SIGN_UP) {
			return <SignUpForm onSubmit={handleSignUpSubmit} />;
		}

		return <SignInForm onSubmit={handleSignInSubmit} />;
	};

	return (
		<>
			state: {dataStatus}
			{getScreen(pathname)}
		</>
	);
};

export { AuthPage };
