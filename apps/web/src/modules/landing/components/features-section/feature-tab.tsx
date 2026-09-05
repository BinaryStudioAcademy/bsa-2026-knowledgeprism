import { Icon } from "~/components/icon/icon.js";
import { useCallback } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import {
	FEATURE_TAB_CLASS,
	FEATURE_TAB_ICON_SIZE,
	FEATURES_LIST,
} from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

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
