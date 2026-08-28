const DEFAULT_ICON_SIZE = 14;

type IconName =
	| "add-knowledge"
	| "aperture"
	| "aperture-expanded"
	| "arrow-right-long"
	| "ask-prism"
	| "bell"
	| "bullet-point"
	| "checkbox-tick"
	| "chevron-down"
	| "chevron-filled-down"
	| "chevron-filled-right"
	| "chevron-filled-up"
	| "close"
	| "desktop"
	| "file"
	| "file-rounded"
	| "file-sharp"
	| "filter"
	| "folder"
	| "glossary"
	| "hamburger"
	| "help"
	| "hexagon-node"
	| "knowledge-tree"
	| "link"
	| "paragraph"
	| "paste-text"
	| "phone"
	| "plus"
	| "project"
	| "search"
	| "send"
	| "settings"
	| "shield"
	| "square-placeholder"
	| "tablet"
	| "toast-check"
	| "upload";

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

const HamburgerIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 18;
	const height = 12;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox="0 0 18 12"
			width={size}
		>
			<path
				d="M0 1h18M0 6h18M0 11h18"
				stroke="currentColor"
				strokeWidth="1.4"
			/>
		</svg>
	);
};

const BellIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 2a5 5 0 0 0-5 5v3.5l-1.5 3h13L15 10.5V7a5 5 0 0 0-5-5z"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
		<path d="M8 16a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

const ApertureIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M10 3v2.2M10 14.8V17M3 10h2.2M14.8 10H17"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const ApertureExpandedIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.4" />
		<path
			d="M10 3v2.2M10 14.8V17M3 10h2.2M14.8 10H17M5.3 5.3l1.5 1.5M13.2 13.2l1.5 1.5M5.3 14.7l1.5-1.5M13.2 6.8l1.5-1.5"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const SearchIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.6" />
		<path
			d="M18 18l-4-4"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

const PlusIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 3v14M3 10h14"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

const AddKnowledgeIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 8.167 8.167" width={size}>
		<path d="M3.6 0h1v3.6H8.2v1H4.6v3.6h-1V4.6H0v-1h3.6z" fill="currentColor" />
	</svg>
);

const CloseIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 14 14" width={size}>
		<path
			d="M1 1l12 12M13 1L1 13"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.5"
		/>
	</svg>
);

const CheckboxTickIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 10.867 8.017" width={size}>
		<path
			d="M1 4l3 3 5.5-6.5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.8"
		/>
	</svg>
);

const ToastCheckIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M4 10.5l4 4L16 6"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="2"
		/>
	</svg>
);

const UploadIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 13V3M6 7l4-4 4 4"
			stroke="currentColor"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="1.5"
		/>
		<path
			d="M4 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2"
			stroke="currentColor"
			strokeWidth="1.5"
		/>
	</svg>
);

const PasteTextIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3 4h14M3 9h14M3 14h9"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.5"
		/>
	</svg>
);

const LinkIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M8.5 11.5a3 3 0 0 0 4 .3l2-2a3 3 0 0 0-4.2-4.2l-1 1M11.5 8.5a3 3 0 0 0-4-.3l-2 2a3 3 0 0 0 4.2 4.2l1-1"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.4"
		/>
	</svg>
);

const FilterIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 13.5;
	const height = 9;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox="0 0 13.5 9"
			width={size}
		>
			<path d="M0 0h13.5L8.5 5.5v3h-3v-3z" fill="currentColor" />
		</svg>
	);
};

const SendIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 13.333 13.333" width={size}>
		<path d="M0 0l13.3 6.7L0 13.3l2.7-6.6z" fill="currentColor" />
	</svg>
);

const ChevronFilledDownIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 12;
	const height = 7.4;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox="0 0 12 7.4"
			width={size}
		>
			<path d="M0 0l6 7.4L12 0z" fill="currentColor" />
		</svg>
	);
};

const ChevronFilledUpIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 12;
	const height = 7.4;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox="0 0 12 7.4"
			width={size}
		>
			<path d="M0 7.4L6 0l6 7.4z" fill="currentColor" />
		</svg>
	);
};

const ChevronFilledRightIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 4.317;
	const height = 7;

	return (
		<svg
			fill="none"
			height={size}
			viewBox="0 0 4.317 7"
			width={(size * width) / height}
		>
			<path d="M0 0l4.3 3.5L0 7z" fill="currentColor" />
		</svg>
	);
};

const ChevronDownIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M5 7.5l5 5 5-5"
			stroke="currentColor"
			strokeLinecap="round"
			strokeWidth="1.6"
		/>
	</svg>
);

const ArrowRightLongIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 20;
	const height = 12;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox="0 0 20 12"
			width={size}
		>
			<path
				d="M0 6h18M13 1l5 5-5 5"
				stroke="currentColor"
				strokeLinecap="round"
				strokeWidth="1.6"
			/>
		</svg>
	);
};

const FolderIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 16;
	const height = 13;

	return (
		<svg
			fill="none"
			height={(size * height) / width}
			viewBox="0 0 16 13"
			width={size}
		>
			<path
				d="M1 3a1 1 0 0 1 1-1h4l1.5 2H14a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z"
				stroke="currentColor"
				strokeWidth="1.2"
			/>
		</svg>
	);
};

const FileRoundedIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M5 2.5h7l3 3v11.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
			stroke="currentColor"
			strokeLinejoin="round"
			strokeWidth="1.3"
		/>
	</svg>
);

const FileSharpIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => {
	const width = 14;
	const height = 16;

	return (
		<svg
			fill="none"
			height={size}
			viewBox="0 0 14 16"
			width={(size * width) / height}
		>
			<path d="M2 1h7l3 3v11H2z" stroke="currentColor" strokeWidth="1.2" />
		</svg>
	);
};

const FileIcon: React.FC<SvgIconProperties> = ({ size }: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<rect
			height="16"
			rx="1.5"
			stroke="currentColor"
			strokeWidth="1.3"
			width="12"
			x="4"
			y="2"
		/>
	</svg>
);

const ShieldIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M10 2l7 4v5c0 4-3 6.5-7 7.5-4-1-7-3.5-7-7.5V6z"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const HexagonNodeIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path d="M10 2l7 4v8l-7 4-7-4V6z" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

const ParagraphIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path
			d="M3 3h14M3 8h14M3 13h10M3 18h10"
			stroke="currentColor"
			strokeWidth="1.4"
		/>
	</svg>
);

const BulletPointIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<circle cx="10" cy="10" fill="currentColor" r="3" />
	</svg>
);

const PhoneIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
		<rect
			height="20"
			rx="2.5"
			stroke="currentColor"
			strokeWidth="1.4"
			width="12"
			x="6"
			y="2"
		/>
		<circle cx="12" cy="18" fill="currentColor" r="1" />
	</svg>
);

const DesktopIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
		<rect
			height="13"
			rx="1.5"
			stroke="currentColor"
			strokeWidth="1.4"
			width="18"
			x="3"
			y="4"
		/>
		<path d="M8 20h8" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

const TabletIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
		<rect
			height="18"
			rx="3"
			stroke="currentColor"
			strokeWidth="1.4"
			width="16"
			x="4"
			y="3"
		/>
		<circle cx="12" cy="18" fill="currentColor" r="1" />
	</svg>
);

const SquarePlaceholderIcon: React.FC<SvgIconProperties> = ({
	size,
}: SvgIconProperties) => (
	<svg fill="none" height={size} viewBox="0 0 20 20" width={size}>
		<path d="M4 4h12v12H4z" stroke="currentColor" strokeWidth="1.4" />
	</svg>
);

const iconMap: Record<IconName, React.FC<SvgIconProperties>> = {
	"add-knowledge": AddKnowledgeIcon,
	aperture: ApertureIcon,
	"aperture-expanded": ApertureExpandedIcon,
	"arrow-right-long": ArrowRightLongIcon,
	"ask-prism": AskPrismIcon,
	bell: BellIcon,
	"bullet-point": BulletPointIcon,
	"checkbox-tick": CheckboxTickIcon,
	"chevron-down": ChevronDownIcon,
	"chevron-filled-down": ChevronFilledDownIcon,
	"chevron-filled-right": ChevronFilledRightIcon,
	"chevron-filled-up": ChevronFilledUpIcon,
	close: CloseIcon,
	desktop: DesktopIcon,
	file: FileIcon,
	"file-rounded": FileRoundedIcon,
	"file-sharp": FileSharpIcon,
	filter: FilterIcon,
	folder: FolderIcon,
	glossary: GlossaryIcon,
	hamburger: HamburgerIcon,
	help: HelpIcon,
	"hexagon-node": HexagonNodeIcon,
	"knowledge-tree": KnowledgeTreeIcon,
	link: LinkIcon,
	paragraph: ParagraphIcon,
	"paste-text": PasteTextIcon,
	phone: PhoneIcon,
	plus: PlusIcon,
	project: ProjectIcon,
	search: SearchIcon,
	send: SendIcon,
	settings: SettingsIcon,
	shield: ShieldIcon,
	"square-placeholder": SquarePlaceholderIcon,
	tablet: TabletIcon,
	"toast-check": ToastCheckIcon,
	upload: UploadIcon,
};

const Icon: React.FC<IconProperties> = ({
	name,
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => {
	const SvgIcon = iconNameToComponent[name];

	return <SvgIcon size={size} />;
};

export { Icon };
