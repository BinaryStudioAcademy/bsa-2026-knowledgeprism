import { useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { useCallback } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import {
	LANDING_PLACEHOLDER_HREF,
	LANDING_SECTION_CONTAINER_CLASS,
} from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { HeroPreview } from "./hero-preview.js";
import { HERO_SECTION_COPY } from "./libs/constants.js";

const HERO_SECTION_CLASS = {
	ACTIONS: "mt-8 flex flex-wrap items-center gap-3.5",
	BODY: "max-w-[480px] text-[16.5px] leading-[1.65] text-text-muted",
	COPY: "min-w-[340px] flex-1",
	HEADING:
		"mb-5 font-serif text-[clamp(34px,5vw,54px)] font-normal leading-[1.08] tracking-[-0.5px] text-text",
	ROOT: `${LANDING_SECTION_CONTAINER_CLASS} flex flex-wrap items-center gap-x-14 gap-y-7 py-[clamp(48px,8vw,96px)]`,
} as const;

const HeroSection: React.FC = () => {
	const navigate = useNavigate();

	const handleSignUp = useCallback((): void => {
		void navigate(AppRoute.SIGN_UP);
	}, [navigate]);

	return (
		<section className={HERO_SECTION_CLASS.ROOT}>
			<div className={HERO_SECTION_CLASS.COPY}>
				<SectionEyebrow>{HERO_SECTION_COPY.eyebrow}</SectionEyebrow>

				<h1 className={HERO_SECTION_CLASS.HEADING}>
					{HERO_SECTION_COPY.heading}
				</h1>

				<p className={HERO_SECTION_CLASS.BODY}>{HERO_SECTION_COPY.body}</p>

				<div className={HERO_SECTION_CLASS.ACTIONS}>
					<Button onClick={handleSignUp} variant="primary">
						{HERO_SECTION_COPY.primaryCTA}
					</Button>
					<a className="btn btn-secondary" href={LANDING_PLACEHOLDER_HREF}>
						{HERO_SECTION_COPY.secondaryCTA}
					</a>
				</div>
			</div>

			<HeroPreview />
		</section>
	);
};

export { HeroSection };
