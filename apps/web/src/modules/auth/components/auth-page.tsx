import { type UserSignUpRequestDto } from "@knowledgeprism/types";

import {
	useAppDispatch,
	useAppSelector,
	useCallback,
	useLocation,
	useNavigate,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { actions as authActions } from "~/modules/auth/auth.js";

import { SignInForm, SignUpForm } from "./components.js";

const AuthPage: React.FC = () => {
	const dispatch = useAppDispatch();
	const { error } = useAppSelector(({ auth }) => ({
		error: auth.error,
	}));
	const { pathname } = useLocation();
	const navigate = useNavigate();

	const handleSignInSubmit = useCallback((): void => {
		// handle sign in
	}, []);

	const handleSignUpSubmit = useCallback(
		(payload: UserSignUpRequestDto): void => {
			void (async (): Promise<void> => {
				const action = await dispatch(authActions.signUp(payload));

				if (authActions.signUp.fulfilled.match(action)) {
					await navigate(AppRoute.WORKSPACE);
				}
			})();
		},
		[dispatch, navigate],
	);

	const getScreen = (screen: string): React.JSX.Element => {
		if (screen === AppRoute.SIGN_UP) {
			return <SignUpForm onSubmit={handleSignUpSubmit} />;
		}

		return <SignInForm onSubmit={handleSignInSubmit} />;
	};

	return (
		<div className="mx-auto flex w-full max-w-[380px] flex-col gap-4 px-6 py-16">
			{error && <span className="font-sans text-sm text-error">{error}</span>}
			{getScreen(pathname)}
		</div>
	);
};

export { AuthPage };
