import { useState } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";
import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { FeaturePreview } from "./feature-preview.js";
import { FeatureTab } from "./feature-tab.js";
import { FEATURES_LIST, FEATURES_SECTION_COPY } from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

const FeaturesSection: React.FC = () => {
	const [activeFeature, setActiveFeature] = useState<ValueOf<typeof FeatureId>>(
		FeatureId.SEARCH,
	);

	return (
		<section
			className={getValidClassNames(
				LANDING_SECTION_CONTAINER_CLASS,
				"py-[clamp(64px,9vw,120px)]",
			)}
			id="features"
		>
			<div className="mx-auto mb-8 max-w-[600px] text-center tablet:mb-14">
				<SectionEyebrow>{FEATURES_SECTION_COPY.eyebrow}</SectionEyebrow>
				<h2 className="mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text">
					{FEATURES_SECTION_COPY.heading}
				</h2>
			</div>
			<div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface tablet:flex-row">
				<div className="flex w-full min-w-0 flex-1 flex-col tablet:min-w-[280px]">
					{FEATURES_LIST.map((feature) => (
						<FeatureTab
							feature={feature}
							isActive={feature.id === activeFeature}
							isLast={feature.id === FeatureId.SECURITY}
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
