import { Avatar, Button } from "~/components/components.js";

import { PLACEHOLDER_USER } from "../libs/constants.js";

const ProfileSummary: React.FC = () => (
	<section className="card p-4.5 tablet:hidden">
		<div className="mb-3.5 flex items-center gap-3">
			<Avatar
				alt={PLACEHOLDER_USER.fullName}
				initials={PLACEHOLDER_USER.initials}
			/>
			<div className="min-w-0">
				<p className="font-sans text-control font-medium text-text">
					{PLACEHOLDER_USER.fullName}
				</p>
				<p className="font-sans text-xs text-text-muted">
					{PLACEHOLDER_USER.email}
				</p>
			</div>
		</div>
		<Button className="w-full" variant="secondary">
			Edit profile
		</Button>
	</section>
);

export { ProfileSummary };
