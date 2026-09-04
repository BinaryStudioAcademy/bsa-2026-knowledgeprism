import { useState } from "~/hooks/hooks.js";
import { type ValueOf } from "~/lib/types/types.js";
import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { FeaturePreview } from "./feature-preview.js";
import { FeatureTab } from "./feature-tab.js";
import {
	FEATURES_LIST,
	FEATURES_SECTION_CLASS,
	FEATURES_SECTION_COPY,
} from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

const FeaturesSection: React.FC = () => {
	const [activeFeature, setActiveFeature] = useState<ValueOf<typeof FeatureId>>(
		FeatureId.SEARCH,
	);

	return (
		<section className={FEATURES_SECTION_CLASS.ROOT} id="features">
			<div className={FEATURES_SECTION_CLASS.HEADER}>
				<SectionEyebrow>{FEATURES_SECTION_COPY.eyebrow}</SectionEyebrow>
				<h2 className={FEATURES_SECTION_CLASS.HEADING}>
					{FEATURES_SECTION_COPY.heading}
				</h2>
			</div>
			<div className={FEATURES_SECTION_CLASS.PANEL}>
				<div className={FEATURES_SECTION_CLASS.TABS}>
					{FEATURES_LIST.map((feature, index) => (
						<FeatureTab
							feature={feature}
							isActive={feature.id === activeFeature}
							isLast={index === FEATURES_LIST.length - 1}
							key={feature.id}
							onSelect={setActiveFeature}
						/>
					))}
				</div>
				<FeaturePreview activeFeature={activeFeature} />
			</div>
		</section>
	);
};

export { FeaturesSection };
