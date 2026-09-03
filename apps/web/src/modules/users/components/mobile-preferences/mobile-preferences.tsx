import { PreferenceRow } from "../preference-row/preference-row.js";

type Properties = {
	isTwoFactorAuthEnabled: boolean;
	isWeeklyDigestEnabled: boolean;
	onTwoFactorAuthChange: (isChecked: boolean) => void;
	onWeeklyDigestChange: (isChecked: boolean) => void;
};

const MobilePreferences: React.FC<Properties> = ({
	isTwoFactorAuthEnabled,
	isWeeklyDigestEnabled,
	onTwoFactorAuthChange,
	onWeeklyDigestChange,
}: Properties) => (
	<>
		<section className="card p-4.5 tablet:hidden">
			<PreferenceRow
				isChecked={isTwoFactorAuthEnabled}
				label="Two-factor authentication"
				onChange={onTwoFactorAuthChange}
			/>
		</section>
		<section className="card p-4.5 tablet:hidden">
			<PreferenceRow
				isChecked={isWeeklyDigestEnabled}
				label="Weekly digest emails"
				onChange={onWeeklyDigestChange}
			/>
		</section>
	</>
);

export { MobilePreferences };
