import { AudienceSection } from "./audience-section/audience-section.js";
import { CtaSection } from "./cta-section/cta-section.js";
import { FeaturesSection } from "./features-section/features-section.js";
import { HeroSection } from "./hero-section/hero-section.js";
import { HowItWorksSection } from "./how-it-works-section/how-it-works-section.js";
import { LandingFooter } from "./landing-footer/landing-footer.js";
import { LandingHeader } from "./landing-header/landing-header.js";
import { SocialProofSection } from "./social-proof-section/social-proof-section.js";
import { WhatItIsSection } from "./what-it-is-section/what-it-is-section.js";

const LandingPage: React.FC = () => {
	return (
		<>
			<LandingHeader />
			<HeroSection />
			<SocialProofSection />
			<WhatItIsSection />
			<HowItWorksSection />
			<FeaturesSection />
			<AudienceSection />
			<CtaSection />
			<LandingFooter />
		</>
	);
};

export { LandingPage };
