import {
	CloseIcon,
	FilterIcon,
	HamburgerIcon,
	LinkIcon,
	PlusIcon,
	SearchIcon,
	SendIcon,
} from "./icons/action.icons.js";
import {
	ArrowRightLongIcon,
	ChevronDownIcon,
	ChevronFilledDownIcon,
	ChevronFilledRightIcon,
	ChevronFilledUpIcon,
} from "./icons/chevron.icons.js";
import { DesktopIcon, PhoneIcon, TabletIcon } from "./icons/device.icons.js";
import {
	AddKnowledgeIcon,
	FileIcon,
	FileRoundedIcon,
	FileSharpIcon,
	FolderIcon,
	PasteTextIcon,
	UploadIcon,
} from "./icons/file.icons.js";
import {
	AskPrismIcon,
	GlossaryIcon,
	HelpIcon,
	KnowledgeTreeIcon,
	ProjectIcon,
	SettingsIcon,
} from "./icons/navigation.icons.js";
import {
	ApertureExpandedIcon,
	ApertureIcon,
	BulletPointIcon,
	HexagonNodeIcon,
	ParagraphIcon,
	SquarePlaceholderIcon,
} from "./icons/shape.icons.js";
import {
	BellIcon,
	CheckboxTickIcon,
	ShieldIcon,
	ToastCheckIcon,
} from "./icons/status.icons.js";
import { type SvgIconProperties } from "./types.js";

const DEFAULT_ICON_SIZE = 14;

const iconNameToComponent = {
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
} as const satisfies Record<string, React.FC<SvgIconProperties>>;

type IconName = keyof typeof iconNameToComponent;

type IconProperties = {
	name: IconName;
	size?: number;
};

const Icon: React.FC<IconProperties> = ({
	name,
	size = DEFAULT_ICON_SIZE,
}: IconProperties) => {
	const SvgIcon = iconNameToComponent[name];

	return <SvgIcon size={size} />;
};

export { Icon };
