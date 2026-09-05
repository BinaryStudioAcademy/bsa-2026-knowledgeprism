import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { HowItWorksStep } from "./how-it-works-step.js";
import {
	HOW_IT_WORKS_SECTION_CLASS,
	HOW_IT_WORKS_SECTION_COPY,
	HOW_IT_WORKS_STEPS,
} from "./libs/constants.js";

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
