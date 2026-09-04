import {
	HOW_IT_WORKS_STEP_CLASS,
	HOW_IT_WORKS_STEPS,
} from "./libs/constants.js";

type HowItWorksStepProperties = (typeof HOW_IT_WORKS_STEPS)[number];

const HowItWorksStep: React.FC<HowItWorksStepProperties> = ({
	body,
	number,
	title,
	variant,
}: HowItWorksStepProperties) => (
	<div className={HOW_IT_WORKS_STEP_CLASS.CARD[variant]}>
		<div className={HOW_IT_WORKS_STEP_CLASS.BADGE[variant]}>{number}</div>
		<h3 className={HOW_IT_WORKS_STEP_CLASS.TITLE[variant]}>{title}</h3>
		<p className={HOW_IT_WORKS_STEP_CLASS.BODY[variant]}>{body}</p>
	</div>
);

export { HowItWorksStep };
