import { Avatar, Button, Heading, Input } from "~/components/components.js";
import { type Control } from "~/hooks/hooks.js";

import { PLACEHOLDER_USER } from "../libs/constants.js";
import { type AccountSettingsFormValues } from "../libs/types.js";

type Properties = {
	control: Control<AccountSettingsFormValues, null>;
};

const ProfileSection: React.FC<Properties> = ({ control }: Properties) => (
	<section className="card hidden tablet:block">
		<Heading className="mb-4.5 hidden desktop:block" level={3}>
			Profile
		</Heading>

		<div className="mb-4 flex items-center gap-3.5 desktop:mb-5 desktop:gap-4">
			<Avatar
				alt={PLACEHOLDER_USER.fullName}
				initials={PLACEHOLDER_USER.initials}
			/>
			<div className="flex gap-2">
				<Button variant="secondary">Change photo</Button>
				<Button
					className="hidden text-error desktop:inline-flex"
					variant="ghost"
				>
					Remove
				</Button>
			</div>
		</div>

		<div className="grid gap-4 desktop:grid-cols-2">
			<Input control={control} label="Full name" name="fullName" />
			<Input
				control={control}
				disabled
				label="Email"
				name="email"
				type="email"
			/>
		</div>
	</section>
);

export { ProfileSection };
