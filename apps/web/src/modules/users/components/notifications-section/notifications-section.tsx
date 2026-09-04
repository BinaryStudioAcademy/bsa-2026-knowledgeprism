import { Heading, Paragraph, ParagraphSize } from "~/components/components.js";

import { type AccountPreferences } from "../libs/types.js";
import { PreferenceRow } from "../preference-row/preference-row.js";

type Properties = {
	onPreferenceChange: (
		key: keyof AccountPreferences,
		isChecked: boolean,
	) => void;
	preferences: AccountPreferences;
};

const NotificationsSection: React.FC<Properties> = ({
	onPreferenceChange,
	preferences,
}: Properties) => (
	<section className="card hidden desktop:block">
		<Heading className="mb-1" level={3}>
			Notifications
		</Heading>
		<Paragraph className="mb-4 text-text-muted" size={ParagraphSize.BODY_SMALL}>
			Choose what you&apos;re notified about.
		</Paragraph>

		<div className="flex flex-col gap-3.5">
			<PreferenceRow
				id="documentUpdates"
				isChecked={preferences.documentUpdates}
				label="Document updates in my projects"
				onChange={onPreferenceChange}
			/>
			<PreferenceRow
				id="weeklyDigest"
				isChecked={preferences.weeklyDigest}
				label="Weekly knowledge base digest"
				onChange={onPreferenceChange}
			/>
			<PreferenceRow
				id="mentions"
				isChecked={preferences.mentions}
				label="Mentions in comments"
				onChange={onPreferenceChange}
			/>
		</div>
	</section>
);

export { NotificationsSection };
