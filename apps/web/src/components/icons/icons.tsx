const DEFAULT_ICON_SIZE = 14;

type IconProperties = {
	size?: number;
};

const KnowledgeTreeIcon: React.FC<IconProperties> = ({
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => (
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

const GlossaryIcon: React.FC<IconProperties> = ({
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => (
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

const AskPrismIcon: React.FC<IconProperties> = ({
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3.5 5.5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H9.5l-3.5 2.8V13.5h-.5a2 2 0 0 1-2-2z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
	</svg>
);

export { AskPrismIcon, GlossaryIcon, KnowledgeTreeIcon };
