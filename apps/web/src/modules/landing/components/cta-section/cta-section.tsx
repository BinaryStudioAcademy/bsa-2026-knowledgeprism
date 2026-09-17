import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { FloatingMark } from "../floating-mark/floating-mark.js";
import { CTA_SECTION_COPY } from "./libs/constants.js";

const CtaSection: React.FC = () => {
	return (
		<section className="relative overflow-hidden bg-primary">
			<FloatingMark
				className={getValidClassNames(
					"pointer-events-none absolute size-[30px] text-primary-fg/[0.15]",
					"left-3 top-3 tablet:left-[8%] tablet:top-[14%]",
				)}
			/>{" "}
			<div className="relative mx-auto max-w-[760px] px-[clamp(20px,5vw,40px)] py-[clamp(64px,9vw,120px)] text-center">
				<h2 className="mb-4 font-serif text-[clamp(28px,4vw,42px)] font-normal leading-[1.15] text-primary-fg">
					{CTA_SECTION_COPY.heading}
				</h2>
				<p className="mx-auto max-w-[520px] text-[15.5px] leading-[1.65] text-primary-fg/65">
					{CTA_SECTION_COPY.body}
				</p>
			</div>
		</section>
	);
};

export { CtaSection };
