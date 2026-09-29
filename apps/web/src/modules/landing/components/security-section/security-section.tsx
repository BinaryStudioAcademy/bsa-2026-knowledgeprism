import { Icon } from "~/components/icon/icon.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { LANDING_BALANCED_SECTION_CLASS } from "~/modules/landing/libs/constants.js";
import { useLandingReveal } from "~/modules/landing/libs/use-landing-reveal.hook.js";

import { SECURITY_ICON_SIZE, SECURITY_SECTION_COPY } from "./libs/constants.js";

const SecuritySection: React.FC = () => {
	const [sectionReference, revealClassName] = useLandingReveal();

	return (
		<section
			className={getValidClassNames(
				LANDING_BALANCED_SECTION_CLASS,
				revealClassName,
				"py-[clamp(64px,9vw,120px)]",
			)}
			ref={sectionReference}
		>
			<div className="flex items-start gap-4 rounded-2xl border border-border bg-secondary p-[clamp(20px,3vw,28px)]">
				<span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-text">
					<Icon name="shield" size={SECURITY_ICON_SIZE} />
				</span>
				<div>
					<h2 className="mb-1 text-base font-medium text-text">
						{SECURITY_SECTION_COPY.title}
					</h2>
					<p className="text-[13.5px] leading-[1.6] text-text-muted">
						{SECURITY_SECTION_COPY.body}
					</p>
				</div>
			</div>
		</section>
	);
};

export { SecuritySection };
