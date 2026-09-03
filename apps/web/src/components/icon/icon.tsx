import { AddKnowledgeIcon } from "./icons/add-knowledge.icon.js";
import { ApertureExpandedIcon } from "./icons/aperture-expanded.icon.js";
import { ApertureIcon } from "./icons/aperture.icon.js";
import { ArrowRightLongIcon } from "./icons/arrow-right-long.icon.js";
import { AskPrismIcon } from "./icons/ask-prism.icon.js";
import { BellIcon } from "./icons/bell.icon.js";
import { BulletPointIcon } from "./icons/bullet-point.icon.js";
import { CheckboxTickIcon } from "./icons/checkbox-tick.icon.js";
import { ChevronDownIcon } from "./icons/chevron-down.icon.js";
import { ChevronFilledDownIcon } from "./icons/chevron-filled-down.icon.js";
import { ChevronFilledRightIcon } from "./icons/chevron-filled-right.icon.js";
import { ChevronFilledUpIcon } from "./icons/chevron-filled-up.icon.js";
import { CloseIcon } from "./icons/close.icon.js";
import { DesktopIcon } from "./icons/desktop.icon.js";
import { FileRoundedIcon } from "./icons/file-rounded.icon.js";
import { FileSharpIcon } from "./icons/file-sharp.icon.js";
import { FileIcon } from "./icons/file.icon.js";
import { FilterIcon } from "./icons/filter.icon.js";
import { FolderIcon } from "./icons/folder.icon.js";
import { GlossaryIcon } from "./icons/glossary.icon.js";
import { HamburgerIcon } from "./icons/hamburger.icon.js";
import { HelpIcon } from "./icons/help.icon.js";
import { HexagonNodeIcon } from "./icons/hexagon-node.icon.js";
import { KnowledgeTreeIcon } from "./icons/knowledge-tree.icon.js";
import { LinkIcon } from "./icons/link.icon.js";
import { ParagraphIcon } from "./icons/paragraph.icon.js";
import { PasteTextIcon } from "./icons/paste-text.icon.js";
import { PhoneIcon } from "./icons/phone.icon.js";
import { PlusIcon } from "./icons/plus.icon.js";
import { ProjectIcon } from "./icons/project.icon.js";
import { SearchIcon } from "./icons/search.icon.js";
import { SendIcon } from "./icons/send.icon.js";
import { SettingsIcon } from "./icons/settings.icon.js";
import { ShieldIcon } from "./icons/shield.icon.js";
import { SquarePlaceholderIcon } from "./icons/square-placeholder.icon.js";
import { TabletIcon } from "./icons/tablet.icon.js";
import { ToastCheckIcon } from "./icons/toast-check.icon.js";
import { UploadIcon } from "./icons/upload.icon.js";
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
