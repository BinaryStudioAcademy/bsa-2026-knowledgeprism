import { Icon } from "~/components/icon/icon.js";
import { useCallback } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";
import { LANDING_FOCUS_RING } from "~/modules/landing/libs/constants.js";

import { FEATURE_TAB_ICON_SIZE, FEATURES_LIST } from "./libs/constants.js";
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

	return (
		<button
			aria-pressed={isActive}
			className={getValidClassNames(
				"flex w-full cursor-pointer gap-3.5 border-l-[3px] px-[26px] py-[22px] text-left",
				LANDING_FOCUS_RING,
				isActive
					? "border-accent bg-success-bg"
					: "border-transparent bg-surface",
				!isLast && "border-b border-border-subtle",
			)}
			onClick={handleSelect}
			type="button"
		>
			<span
				className={getValidClassNames(
					"mt-0.5 shrink-0",
					isActive ? "text-accent" : "text-text-faint",
				)}
			>
				<Icon name={feature.iconName} size={FEATURE_TAB_ICON_SIZE} />
			</span>
			<div>
				<h4
					className={getValidClassNames(
						"mb-1 text-[15px] font-medium",
						isActive ? "text-accent" : "text-text",
					)}
				>
					{feature.title}
				</h4>
				<p className="text-[12.5px] leading-[1.55] text-text-muted">
					{feature.body}
				</p>
			</div>
		</button>
	);
};

export { FeatureTab };
