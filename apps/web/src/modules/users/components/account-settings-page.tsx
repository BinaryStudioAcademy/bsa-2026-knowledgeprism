import {
	Button,
	Heading,
	Icon,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import {
	useAppForm,
	useCallback,
	useEffect,
	useNavigate,
	useState,
} from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";

import {
	DangerZoneSection,
	MobilePreferences,
	NotificationsSection,
	ProfileSection,
	ProfileSummary,
	SecuritySection,
} from "./components.js";
import {
	DEFAULT_ACCOUNT_PREFERENCES,
	DEFAULT_ACCOUNT_SETTINGS_PAYLOAD,
	TOAST_DISMISS_DELAY_MS,
} from "./libs/constants.js";
import {
	type AccountPreferences,
	type AccountSettingsFormValues,
} from "./libs/types.js";

const TOAST_ICON_SIZE = 14;

const AccountSettingsPage: React.FC = () => {
	const navigate = useNavigate();
	const { control, handleSubmit } = useAppForm<AccountSettingsFormValues>({
		defaultValues: DEFAULT_ACCOUNT_SETTINGS_PAYLOAD,
	});

	const [preferences, setPreferences] = useState<AccountPreferences>(
		DEFAULT_ACCOUNT_PREFERENCES,
	);
	const [isToastVisible, setIsToastVisible] = useState(false);

	useEffect(() => {
		const timeout = isToastVisible
			? setTimeout(() => {
					setIsToastVisible(false);
				}, TOAST_DISMISS_DELAY_MS)
			: null;

		return (): void => {
			if (timeout !== null) {
				clearTimeout(timeout);
			}
		};
	}, [isToastVisible]);

	const handleTwoFactorAuthChange = useCallback((isChecked: boolean): void => {
		setPreferences((previous) => ({ ...previous, twoFactorAuth: isChecked }));
	}, []);

	const handleDocumentUpdatesChange = useCallback(
		(isChecked: boolean): void => {
			setPreferences((previous) => ({
				...previous,
				documentUpdates: isChecked,
			}));
		},
		[],
	);

	const handleWeeklyDigestChange = useCallback((isChecked: boolean): void => {
		setPreferences((previous) => ({ ...previous, weeklyDigest: isChecked }));
	}, []);

	const handleMentionsChange = useCallback((isChecked: boolean): void => {
		setPreferences((previous) => ({ ...previous, mentions: isChecked }));
	}, []);

	const handleValidSubmit = useCallback((): void => {
		setIsToastVisible(true);
	}, []);

	const handleFormSubmit = useCallback(
		(event_: React.BaseSyntheticEvent): void => {
			void handleSubmit(handleValidSubmit)(event_);
		},
		[handleSubmit, handleValidSubmit],
	);

	const handleCancelClick = useCallback((): void => {
		void navigate(AppRoute.WORKSPACE);
	}, [navigate]);

	const handleDeleteAccountClick = useCallback((): void => {
		// confirmation modal arrives with kp-34
	}, []);

	return (
		<div className="relative flex flex-1 justify-center overflow-auto p-4 tablet:p-7 desktop:px-11 desktop:py-10">
			{isToastVisible && (
				<div className="absolute right-8 top-4.5 z-20 flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 font-sans text-sm font-medium text-primary-fg shadow-lg">
					<Icon name="toast-check" size={TOAST_ICON_SIZE} />
					Changes saved
				</div>
			)}

			<form
				className="flex w-full flex-col gap-3.5 tablet:w-130 tablet:gap-4.5 desktop:w-160 desktop:gap-6"
				onSubmit={handleFormSubmit}
			>
				<div>
					<Heading level={2}>Account Settings</Heading>
					<Paragraph
						className="mt-1.5 hidden text-text-muted desktop:block"
						size={ParagraphSize.BODY_SMALL}
					>
						Manage your profile, security and notification preferences.
					</Paragraph>
				</div>

				<ProfileSummary />
				<ProfileSection control={control} />

				<SecuritySection
					control={control}
					isTwoFactorAuthEnabled={preferences.twoFactorAuth}
					onTwoFactorAuthChange={handleTwoFactorAuthChange}
				/>

				<NotificationsSection
					isDocumentUpdatesEnabled={preferences.documentUpdates}
					isMentionsEnabled={preferences.mentions}
					isWeeklyDigestEnabled={preferences.weeklyDigest}
					onDocumentUpdatesChange={handleDocumentUpdatesChange}
					onMentionsChange={handleMentionsChange}
					onWeeklyDigestChange={handleWeeklyDigestChange}
				/>

				<MobilePreferences
					isTwoFactorAuthEnabled={preferences.twoFactorAuth}
					isWeeklyDigestEnabled={preferences.weeklyDigest}
					onTwoFactorAuthChange={handleTwoFactorAuthChange}
					onWeeklyDigestChange={handleWeeklyDigestChange}
				/>

				<DangerZoneSection onDeleteAccountClick={handleDeleteAccountClick} />

				<div className="hidden justify-end gap-2.5 desktop:flex">
					<Button onClick={handleCancelClick} variant="secondary">
						Cancel
					</Button>
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		</div>
	);
};

export { AccountSettingsPage };
