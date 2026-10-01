import { useState } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";
import { LANDING_BALANCED_SECTION_CLASS } from "~/modules/landing/libs/constants.js";
import { useLandingReveal } from "~/modules/landing/libs/use-landing-reveal.hook.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { FeaturePreview } from "./feature-preview.js";
import { FeatureTab } from "./feature-tab.js";
import {
	FEATURES_LIST,
	FEATURES_SECTION_COPY,
	LAST_INDEX_OFFSET,
} from "./libs/constants.js";
import { FeatureId } from "./libs/enums/feature-id.enum.js";

const FeaturesSection: React.FC = () => {
	const [sectionReference, revealClassName] = useLandingReveal();
	const [activeFeature, setActiveFeature] = useState<ValueOf<typeof FeatureId>>(
		FeatureId.KNOWLEDGE_BASE,
	);

	return (
		<section
			className={getValidClassNames(
				LANDING_BALANCED_SECTION_CLASS,
				revealClassName,
				"py-[clamp(36px,5vw,64px)]",
			)}
			id="features"
			ref={sectionReference}
		>
			<div className="mx-auto mb-8 max-w-[600px] text-center tablet:mb-14">
				<SectionEyebrow>{FEATURES_SECTION_COPY.eyebrow}</SectionEyebrow>
				<h2 className="mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text">
					{FEATURES_SECTION_COPY.heading}
				</h2>
			</div>
			<div className="flex w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface tablet:flex-row">
				<div className="flex w-full min-w-0 flex-1 flex-col tablet:min-w-[280px]">
					{FEATURES_LIST.map((feature, index) => {
						const isActive = feature.id === activeFeature;
						const isLast = index === FEATURES_LIST.length - LAST_INDEX_OFFSET;

						return (
							<div key={feature.id}>
								<FeatureTab
									feature={feature}
									isActive={isActive}
									isLast={isLast}
									onSelect={setActiveFeature}
								/>
								{isActive && (
									<div
										className={getValidClassNames(
											"tablet:hidden",
											!isLast && "border-b border-border",
										)}
									>
										<FeaturePreview activeFeature={activeFeature} />
									</div>
								)}
							</div>
						);
					})}
				</div>
				<div className="hidden min-w-0 flex-1 tablet:flex">
					<FeaturePreview activeFeature={activeFeature} />
				</div>
			</div>
		</section>
	);
};

export { FeaturesSection };
