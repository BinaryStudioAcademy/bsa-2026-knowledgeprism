import { useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { useCallback } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { HeroPreview } from "./hero-preview.js";
import { HERO_SECTION_CLASS, HERO_SECTION_COPY } from "./libs/constants.js";

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
					<Button type="button" variant="secondary">
						{HERO_SECTION_COPY.secondaryCTA}
					</Button>
				</div>
			</div>

			<HeroPreview />
		</section>
	);
};

export { HeroSection };
