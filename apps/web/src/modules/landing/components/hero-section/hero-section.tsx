import { Link } from "~/components/components.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { SectionEyebrow } from "../section-eyebrow/section-eyebrow.js";
import { HERO_SECTION_COPY, HERO_SECTION_CLASS } from "./libs/constants.js";
import { Button } from "~/components/button/button.js";

const HeroSection: React.FC = () => {
	return (
		<section className={HERO_SECTION_CLASS.ROOT}>
			<SectionEyebrow>{HERO_SECTION_COPY.eyebrow}</SectionEyebrow>

			<h1 className={HERO_SECTION_CLASS.HEADING}>
				{HERO_SECTION_COPY.heading}
			</h1>

			<p className={HERO_SECTION_CLASS.BODY}>{HERO_SECTION_COPY.body}</p>

			<Link to={AppRoute.SIGN_UP}>{HERO_SECTION_COPY.primaryCTA}</Link>

			<Button type="button" variant="ghost">
				{HERO_SECTION_COPY.secondaryCTA}
			</Button>
		</section>
	);
};

export { HeroSection };
