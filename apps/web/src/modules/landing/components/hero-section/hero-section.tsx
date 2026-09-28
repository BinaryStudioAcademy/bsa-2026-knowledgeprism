import { useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { useCallback } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import {
	LANDING_FLEX_COLUMN_CLASS,
	LANDING_SECTION_CONTAINER_CLASS,
} from "~/modules/landing/libs/constants.js";
import { useLandingReveal } from "~/modules/landing/libs/use-landing-reveal.hook.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { HeroPreview } from "./hero-preview.js";
import { HERO_SECTION_COPY, HERO_TEXT_COLUMN_CLASS } from "./libs/constants.js";

const HeroSection: React.FC = () => {
	const [sectionReference, revealClassName] = useLandingReveal();
	const navigate = useNavigate();

	const handleSignUp = useCallback((): void => {
		void navigate(AppRoute.SIGN_UP);
	}, [navigate]);

	return (
		<section
			className={getValidClassNames(
				revealClassName,
				LANDING_SECTION_CONTAINER_CLASS,
				"flex flex-wrap items-center gap-x-16 gap-y-8 py-[clamp(64px,9vw,120px)]",
			)}
			ref={sectionReference}
		>
			<div
				className={getValidClassNames(
					LANDING_FLEX_COLUMN_CLASS,
					HERO_TEXT_COLUMN_CLASS,
					"mobile:min-w-[320px]",
				)}
			>
				<SectionEyebrow>{HERO_SECTION_COPY.eyebrow}</SectionEyebrow>

				<h1 className="mb-4 mt-3 font-serif text-[clamp(26px,3.2vw,34px)] font-normal leading-[1.2] text-text">
					<span className="block">{HERO_SECTION_COPY.headingLead}</span>
					<span className="block italic text-accent">
						{HERO_SECTION_COPY.headingAccent}
					</span>
					<span className="block">{HERO_SECTION_COPY.headingTail}</span>
				</h1>

				<p className="max-w-[440px] text-[15.5px] leading-[1.7] text-text-muted">
					{HERO_SECTION_COPY.body}
				</p>

				<div className="mt-8 flex flex-wrap items-center gap-3.5">
					<Button onClick={handleSignUp} variant="primary">
						{HERO_SECTION_COPY.primaryCTA}
					</Button>
				</div>
			</div>

			<HeroPreview />
		</section>
	);
};

export { HeroSection };
