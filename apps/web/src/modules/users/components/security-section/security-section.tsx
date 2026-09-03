import { Heading, Input } from "~/components/components.js";
import { type Control } from "~/hooks/hooks.js";

import { type AccountSettingsFormValues } from "../libs/types.js";
import { PreferenceRow } from "../preference-row/preference-row.js";

type Properties = {
	control: Control<AccountSettingsFormValues, null>;
	isTwoFactorAuthEnabled: boolean;
	onTwoFactorAuthChange: (isChecked: boolean) => void;
};

const SecuritySection: React.FC<Properties> = ({
	control,
	isTwoFactorAuthEnabled,
	onTwoFactorAuthChange,
}: Properties) => (
	<section className="card hidden desktop:block">
		<Heading className="mb-4.5" level={3}>
			Security
		</Heading>

		<div className="mb-4 grid gap-4 desktop:grid-cols-2">
			<Input
				control={control}
				label="Current password"
				name="currentPassword"
				type="password"
			/>
			<Input
				control={control}
				label="New password"
				name="newPassword"
				placeholder="Enter new password"
				type="password"
			/>
		</div>

		<div className="border-t border-border-subtle pt-4">
			<PreferenceRow
				description="Add an extra layer of security to your account."
				isChecked={isTwoFactorAuthEnabled}
				label="Two-factor authentication"
				onChange={onTwoFactorAuthChange}
			/>
		</div>
	</section>
);

export { SecuritySection };
