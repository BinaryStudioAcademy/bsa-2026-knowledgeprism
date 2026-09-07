import { HOW_IT_WORKS_STEPS } from "./libs/constants.js";

const HOW_IT_WORKS_BADGE_CLASS =
	"mb-4 flex size-[34px] items-center justify-center rounded-lg font-mono text-[13px] font-semibold";
const HOW_IT_WORKS_BODY_CLASS = "text-[13px] leading-[1.6]";
const HOW_IT_WORKS_CARD_CLASS = "min-w-[220px] flex-1 rounded-xl p-6";
const HOW_IT_WORKS_TITLE_CLASS = "mb-2 text-[15px] font-medium";

const HOW_IT_WORKS_STEP_CLASS = {
	BADGE: {
		default: `${HOW_IT_WORKS_BADGE_CLASS} bg-success-bg text-accent`,
		highlight: `${HOW_IT_WORKS_BADGE_CLASS} bg-primary-fg/[0.12] text-primary-fg`,
	},
	BODY: {
		default: `${HOW_IT_WORKS_BODY_CLASS} text-text-muted`,
		highlight: `${HOW_IT_WORKS_BODY_CLASS} text-primary-fg/70`,
	},
	CARD: {
		default: `${HOW_IT_WORKS_CARD_CLASS} border border-border bg-surface`,
		highlight: `${HOW_IT_WORKS_CARD_CLASS} border border-primary bg-primary`,
	},
	TITLE: {
		default: `${HOW_IT_WORKS_TITLE_CLASS} text-text`,
		highlight: `${HOW_IT_WORKS_TITLE_CLASS} text-primary-fg`,
	},
} as const;

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
