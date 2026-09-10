import { useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { useCallback } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import {
	LANDING_FOCUS_RING,
	LANDING_PLACEHOLDER_HREF,
	LANDING_SECTION_CONTAINER_CLASS,
} from "~/modules/landing/libs/constants.js";

import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { HeroPreview } from "./hero-preview.js";
import { HERO_SECTION_COPY } from "./libs/constants.js";

const HeroSection: React.FC = () => {
	const navigate = useNavigate();

	const handleSignUp = useCallback((): void => {
		void navigate(AppRoute.SIGN_UP);
	}, [navigate]);

	return (
		<section
			className={getValidClassNames(
				LANDING_SECTION_CONTAINER_CLASS,
				"flex flex-wrap items-center gap-x-14 gap-y-7 py-[clamp(48px,8vw,96px)]",
			)}
		>
			<div className="min-w-[340px] flex-1">
				<SectionEyebrow>{HERO_SECTION_COPY.eyebrow}</SectionEyebrow>

				<h1 className="mb-5 font-serif text-[clamp(34px,5vw,54px)] font-normal leading-[1.08] tracking-[-0.5px] text-text">
					{HERO_SECTION_COPY.heading}
				</h1>

				<p className="max-w-[480px] text-[16.5px] leading-[1.65] text-text-muted">
					{HERO_SECTION_COPY.body}
				</p>

				<div className="mt-8 flex flex-wrap items-center gap-3.5">
					<Button onClick={handleSignUp} variant="primary">
						{HERO_SECTION_COPY.primaryCTA}
					</Button>
					<a
						className={getValidClassNames(
							"inline-flex items-center justify-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-[13px] font-medium leading-normal text-text no-underline transition-colors hover:bg-border-subtle hover:no-underline",
							LANDING_FOCUS_RING,
						)}
						href={LANDING_PLACEHOLDER_HREF}
					>
						{HERO_SECTION_COPY.secondaryCTA}
					</a>
				</div>
			</div>

			<HeroPreview />
		</section>
	);
};

export { HeroSection };
