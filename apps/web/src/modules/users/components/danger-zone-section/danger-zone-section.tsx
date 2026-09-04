import {
	Button,
	Heading,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";

type Properties = {
	onDeleteAccountClick: () => void;
};

const DangerZoneSection: React.FC<Properties> = ({
	onDeleteAccountClick,
}: Properties) => (
	<section className="card border-error/30 bg-error-bg p-4.5 tablet:p-6">
		<Heading className="mb-1.5 text-error" level={3}>
			Danger zone
		</Heading>
		<Paragraph
			className="mb-4 hidden text-text-muted desktop:block"
			size={ParagraphSize.BODY_SMALL}
		>
			Deleting your account permanently removes your profile and workspace
			access. This can&apos;t be undone.
		</Paragraph>
		<Button
			className="w-full tablet:w-auto"
			onClick={onDeleteAccountClick}
			variant="destructive"
		>
			Delete account
		</Button>
	</section>
);

export { DangerZoneSection };
