import { Icon } from "~/components/icon/icon.js";
import { useCallback } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { FEATURE_TAB_ICON_SIZE, FEATURES_LIST } from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

const FEATURE_TAB_ICON_CLASS = "mt-0.5 shrink-0";
const FEATURE_TAB_TITLE_CLASS = "mb-1 text-[15px] font-medium";

const FEATURE_TAB_CLASS = {
	BODY: "text-[12.5px] leading-[1.55] text-text-muted",
	DIVIDER: "border-b border-border-subtle",
	FOCUS_RING:
		"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35",
	ICON: {
		active: `${FEATURE_TAB_ICON_CLASS} text-accent`,
		default: `${FEATURE_TAB_ICON_CLASS} text-text-faint`,
	},
	ROOT: "flex w-full cursor-pointer gap-3.5 border-l-[3px] px-[26px] py-[22px] text-left",
	STATE: {
		active: "border-accent bg-success-bg",
		default: "border-transparent bg-surface",
	},
	TITLE: {
		active: `${FEATURE_TAB_TITLE_CLASS} text-accent`,
		default: `${FEATURE_TAB_TITLE_CLASS} text-text`,
	},
} as const;

type Feature = (typeof FEATURES_LIST)[number];

type Properties = {
	feature: Feature;
	isActive: boolean;
	isLast: boolean;
	onSelect: (id: ValueOf<typeof FeatureId>) => void;
};

const FeatureTab: React.FC<Properties> = ({
	feature,
	isActive,
	isLast,
	onSelect,
}: Properties) => {
	const handleSelect = useCallback((): void => {
		onSelect(feature.id);
	}, [feature.id, onSelect]);

	const state = isActive
		? FEATURE_TAB_CLASS.STATE.active
		: FEATURE_TAB_CLASS.STATE.default;
	const iconClass = isActive
		? FEATURE_TAB_CLASS.ICON.active
		: FEATURE_TAB_CLASS.ICON.default;
	const titleClass = isActive
		? FEATURE_TAB_CLASS.TITLE.active
		: FEATURE_TAB_CLASS.TITLE.default;

	return (
		<button
			aria-pressed={isActive}
			className={getValidClassNames(
				FEATURE_TAB_CLASS.ROOT,
				FEATURE_TAB_CLASS.FOCUS_RING,
				state,
				!isLast && FEATURE_TAB_CLASS.DIVIDER,
			)}
			onClick={handleSelect}
			type="button"
		>
			<span className={iconClass}>
				<Icon name={feature.iconName} size={FEATURE_TAB_ICON_SIZE} />
			</span>
			<div>
				<h4 className={titleClass}>{feature.title}</h4>
				<p className={FEATURE_TAB_CLASS.BODY}>{feature.body}</p>
			</div>
		</button>
	);
};

export { FeatureTab };
