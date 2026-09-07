import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { HowItWorksStep } from "./how-it-works-step.js";
import {
	HOW_IT_WORKS_SECTION_COPY,
	HOW_IT_WORKS_STEPS,
} from "./libs/constants.js";

const HOW_IT_WORKS_SECTION_CLASS = {
	CARDS: "flex flex-wrap gap-5",
	HEADER: "mx-auto mb-8 max-w-[600px] text-center tablet:mb-14",
	HEADING:
		"mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text",
	INNER: `${LANDING_SECTION_CONTAINER_CLASS} py-[clamp(64px,9vw,120px)]`,
	ROOT: "border-y border-border bg-secondary",
} as const;

const HowItWorksSection: React.FC = () => (
	<section className={HOW_IT_WORKS_SECTION_CLASS.ROOT} id="how">
		<div className={HOW_IT_WORKS_SECTION_CLASS.INNER}>
			<div className={HOW_IT_WORKS_SECTION_CLASS.HEADER}>
				<SectionEyebrow>{HOW_IT_WORKS_SECTION_COPY.eyebrow}</SectionEyebrow>
				<h2 className={HOW_IT_WORKS_SECTION_CLASS.HEADING}>
					{HOW_IT_WORKS_SECTION_COPY.heading}
				</h2>
			</div>
			<div className={HOW_IT_WORKS_SECTION_CLASS.CARDS}>
				{HOW_IT_WORKS_STEPS.map((step) => (
					<HowItWorksStep key={step.number} {...step} />
				))}
			</div>
		</div>
	</section>
);

export { HowItWorksSection };
