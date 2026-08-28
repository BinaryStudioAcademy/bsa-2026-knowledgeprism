const DEFAULT_ICON_SIZE = 14;

type IconName =
	"ask-prism" | "glossary" | "help" | "knowledge-tree" | "project" | "settings";

type IconProperties = {
	name: IconName;
	size?: number;
};

type SvgIconProperties = {
	size: number;
};

const KnowledgeTreeIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="4.5" r="2" stroke="currentColor" strokeWidth="1.4" />
		<circle cx="4" cy="15.5" r="2" stroke="currentColor" strokeWidth="1.4" />
		<circle cx="16" cy="15.5" r="2" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M10 6.5V10M10 10L4 13.5M10 10l6 3.5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.4"
		/>
	</svg>
);

const GlossaryIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 6c-1.6-1.2-4-1.7-6.5-1.3v10c2.5-.4 4.9.1 6.5 1.3 1.6-1.2 4-1.7 6.5-1.3v-10C14 4.3 11.6 4.8 10 6z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
		<path d="M10 6v10" stroke="currentColor" strokeWidth="1.3" />
	</svg>
);

const AskPrismIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9.5l-3.5 2.8V13.5h-.5a2 2 0 0 1-2-2z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
	</svg>
);

const HelpIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M7.8 8.2a2.2 2.2 0 1 1 3.4 1.8c-.7.5-1.2.9-1.2 1.8"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.4"
		/>
		<circle cx="10" cy="14.3" fill="currentColor" r="0.6" />
	</svg>
);

const SettingsIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 3.3l1.1 1.6 1.9-.5.7 1.9 1.9.7-.5 1.9 1.6 1.1-1.6 1.1.5 1.9-1.9.7-.7 1.9-1.9-.5L10 16.7l-1.1-1.6-1.9.5-.7-1.9-1.9-.7.5-1.9L3.3 10l1.6-1.1-.5-1.9 1.9-.7.7-1.9 1.9.5z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.1"
		/>
		<circle cx="10" cy="10" r="2.3" stroke="currentColor" strokeWidth="1.2" />
	</svg>
);

const ProjectIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 2l6 3.5v9L10 18l-6-3.5v-9z"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const iconMap: Record<IconName, React.FC<SvgIconProperties>> = {
	"ask-prism": AskPrismIcon,
	glossary: GlossaryIcon,
	help: HelpIcon,
	"knowledge-tree": KnowledgeTreeIcon,
	project: ProjectIcon,
	settings: SettingsIcon,
};

const Icon: React.FC<IconProperties> = ({
	name,
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => {
	const SvgIcon = iconMap[name];

	return <SvgIcon size={size} />;
};

export { Icon };
