import { Heading, Paragraph, ParagraphSize } from "~/components/components.js";

import { PreferenceRow } from "../preference-row/preference-row.js";

type Properties = {
	isDocumentUpdatesEnabled: boolean;
	isMentionsEnabled: boolean;
	isWeeklyDigestEnabled: boolean;
	onDocumentUpdatesChange: (isChecked: boolean) => void;
	onMentionsChange: (isChecked: boolean) => void;
	onWeeklyDigestChange: (isChecked: boolean) => void;
};

const NotificationsSection: React.FC<Properties> = ({
	isDocumentUpdatesEnabled,
	isMentionsEnabled,
	isWeeklyDigestEnabled,
	onDocumentUpdatesChange,
	onMentionsChange,
	onWeeklyDigestChange,
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
				isChecked={isDocumentUpdatesEnabled}
				label="Document updates in my projects"
				onChange={onDocumentUpdatesChange}
			/>
			<PreferenceRow
				isChecked={isWeeklyDigestEnabled}
				label="Weekly knowledge base digest"
				onChange={onWeeklyDigestChange}
			/>
			<PreferenceRow
				isChecked={isMentionsEnabled}
				label="Mentions in comments"
				onChange={onMentionsChange}
			/>
		</div>
	</section>
);

export { NotificationsSection };
