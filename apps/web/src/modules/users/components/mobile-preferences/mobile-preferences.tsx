import { type AccountPreferences } from "../libs/types.js";
import { PreferenceRow } from "../preference-row/preference-row.js";

type Properties = {
	onPreferenceChange: (
		key: keyof AccountPreferences,
		isChecked: boolean,
	) => void;
	preferences: AccountPreferences;
};

const MobilePreferences: React.FC<Properties> = ({
	onPreferenceChange,
	preferences,
}: Properties) => (
	<>
		<section className="card p-4.5 tablet:hidden">
			<PreferenceRow
				id="twoFactorAuth"
				isChecked={preferences.twoFactorAuth}
				label="Two-factor authentication"
				onChange={onPreferenceChange}
			/>
		</section>
		<section className="card p-4.5 tablet:hidden">
			<PreferenceRow
				id="weeklyDigest"
				isChecked={preferences.weeklyDigest}
				label="Weekly digest emails"
				onChange={onPreferenceChange}
			/>
		</section>
	</>
);

export { MobilePreferences };
