import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { HOW_IT_WORKS_STEPS } from "./libs/constants.js";

type HowItWorksStepProperties = (typeof HOW_IT_WORKS_STEPS)[number];

const HowItWorksStep: React.FC<HowItWorksStepProperties> = ({
	body,
	number,
	title,
	variant,
}: HowItWorksStepProperties) => {
	const isHighlight = variant === "highlight";

	return (
		<div
			className={getValidClassNames(
				"min-w-[220px] flex-1 rounded-xl p-6",
				isHighlight
					? "border border-primary bg-primary"
					: "border border-border bg-surface",
			)}
		>
			<div
				className={getValidClassNames(
					"mb-4 flex size-[34px] items-center justify-center rounded-lg font-mono text-[13px] font-semibold",
					isHighlight
						? "bg-primary-fg/[0.12] text-primary-fg"
						: "bg-success-bg text-accent",
				)}
			>
				{number}
			</div>
			<h3
				className={getValidClassNames(
					"mb-2 text-[15px] font-medium",
					isHighlight ? "text-primary-fg" : "text-text",
				)}
			>
				{title}
			</h3>
			<p
				className={getValidClassNames(
					"text-[13px] leading-[1.6]",
					isHighlight ? "text-primary-fg/70" : "text-text-muted",
				)}
			>
				{body}
			</p>
		</div>
	);
};

export { HowItWorksStep };
