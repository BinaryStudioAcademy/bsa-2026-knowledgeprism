import { HeroSection } from "./hero-section/hero-section.js";
import { LandingHeader } from "./landing-header/landing-header.js";
import { SocialProofSection } from "./social-proof-section/social-proof-section.js";

const LandingPage: React.FC = () => {
	return (
		<>
			<LandingHeader />
			<HeroSection />
			<SocialProofSection />
		</>
	);
};

export { LandingPage };
