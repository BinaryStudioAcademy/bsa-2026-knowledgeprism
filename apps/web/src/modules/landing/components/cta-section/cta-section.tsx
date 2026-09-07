import { useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { useCallback } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { LANDING_PLACEHOLDER_HREF } from "~/modules/landing/libs/constants.js";

import { FloatingMark } from "../floating-mark/floating-mark.js";
import { CTA_SECTION_COPY } from "./libs/constants.js";

const CTA_SECTION_CLASS = {
	ACTIONS: "flex flex-wrap justify-center gap-3.5",
	BODY: "mx-auto mb-8 max-w-[520px] text-[15.5px] leading-[1.65] text-primary-fg/65",
	HEADING:
		"mb-4 font-serif text-[clamp(28px,4vw,42px)] font-normal leading-[1.15] text-primary-fg",
	INNER:
		"relative mx-auto max-w-[760px] px-[clamp(20px,5vw,40px)] py-[clamp(64px,9vw,120px)] text-center",
	MARK: "pointer-events-none absolute left-[8%] top-[14%] size-[30px] text-primary-fg/[0.15]",
	PRIMARY_BUTTON: "bg-primary-fg text-primary hover:bg-success-bg",
	ROOT: "relative overflow-hidden bg-primary",
	SECONDARY_BUTTON:
		"border-primary-fg/30 bg-transparent text-primary-fg hover:bg-primary-fg/[0.08]",
} as const;

const CtaSection: React.FC = () => {
	const navigate = useNavigate();

	const handleSignUp = useCallback((): void => {
		void navigate(AppRoute.SIGN_UP);
	}, [navigate]);

	return (
		<section className={CTA_SECTION_CLASS.ROOT}>
			<FloatingMark className={CTA_SECTION_CLASS.MARK} />
			<div className={CTA_SECTION_CLASS.INNER}>
				<h2 className={CTA_SECTION_CLASS.HEADING}>
					{CTA_SECTION_COPY.heading}
				</h2>
				<p className={CTA_SECTION_CLASS.BODY}>{CTA_SECTION_COPY.body}</p>
				<div className={CTA_SECTION_CLASS.ACTIONS}>
					<Button
						className={CTA_SECTION_CLASS.PRIMARY_BUTTON}
						onClick={handleSignUp}
						variant="primary"
					>
						{CTA_SECTION_COPY.primaryCTA}
					</Button>
					<a
						className={getValidClassNames(
							"btn btn-secondary",
							CTA_SECTION_CLASS.SECONDARY_BUTTON,
						)}
						href={LANDING_PLACEHOLDER_HREF}
					>
						{CTA_SECTION_COPY.secondaryCTA}
					</a>
				</div>
			</div>
		</section>
	);
};

export { CtaSection };
