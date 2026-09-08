import { type UserSignUpRequestDto } from "@knowledgeprism/types";

import { Logo } from "~/components/components.js";
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
		<div className="flex min-h-screen flex-col tablet:flex-row">
			<aside className="flex flex-shrink-0 flex-col justify-between gap-2.5 bg-primary px-6 py-7 text-primary-fg tablet:flex-[0.8] tablet:p-11 desktop:flex-1 desktop:p-16">
				<Logo variant="inverted" />

				<div className="max-w-95">
					<p className="font-serif text-h3 leading-tight desktop:text-h2">
						Order from Chaos.
					</p>
					<p className="mt-3.5 hidden text-body leading-relaxed text-white/65 desktop:block">
						Turn scattered documents into one queryable knowledge graph — with
						every answer traced back to its source.
					</p>
				</div>

				<span className="hidden font-mono text-xs text-white/40 tablet:block">
					© {new Date().getFullYear()} KnowledgePrism AI
				</span>
			</aside>

			<main className="flex flex-1 items-center justify-center px-5.5 py-7 tablet:p-11 desktop:p-16">
				<div className="flex w-full max-w-85 flex-col gap-4 desktop:max-w-95">
					{error && (
						<span className="font-sans text-sm text-error">{error}</span>
					)}
					{getScreen(pathname)}
				</div>
			</main>
		</div>
	);
};

export { AuthPage };
