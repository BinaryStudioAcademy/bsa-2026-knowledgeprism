import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { HowItWorksStep } from "./how-it-works-step.js";
import {
	HOW_IT_WORKS_SECTION_COPY,
	HOW_IT_WORKS_STEPS,
} from "./libs/constants.js";

const HowItWorksSection: React.FC = () => (
	<section className="border-y border-border bg-secondary" id="how">
		<div
			className={getValidClassNames(
				LANDING_SECTION_CONTAINER_CLASS,
				"py-[clamp(64px,9vw,120px)]",
			)}
		>
			<div className="mx-auto mb-8 max-w-[600px] text-center tablet:mb-14">
				<SectionEyebrow>{HOW_IT_WORKS_SECTION_COPY.eyebrow}</SectionEyebrow>
				<h2 className="mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text">
					{HOW_IT_WORKS_SECTION_COPY.heading}
				</h2>
			</div>
			<div className="flex flex-wrap gap-5">
				{HOW_IT_WORKS_STEPS.map((step) => (
					<HowItWorksStep key={step.number} {...step} />
				))}
			</div>
		</div>
	</section>
);

export { HowItWorksSection };
