import { useEffect } from "react";

import { Footer } from "~/components/components.js";

import { AudienceSection } from "./audience-section/audience-section.js";
import { CtaSection } from "./cta-section/cta-section.js";
import { FeaturesSection } from "./features-section/features-section.js";
import { HeroSection } from "./hero-section/hero-section.js";
import { HowItWorksSection } from "./how-it-works-section/how-it-works-section.js";
import { LandingHeader } from "./landing-header/landing-header.js";
import { SocialProofSection } from "./social-proof-section/social-proof-section.js";
import { WhatItIsSection } from "./what-it-is-section/what-it-is-section.js";

const LandingPage: React.FC = () => {
	useEffect(() => {
		const root = document.documentElement;
		root.classList.add("scroll-smooth");
		return (): void => {
			root.classList.remove("scroll-smooth");
		};
	}, []);

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
			<Footer />
		</>
	);
};

export { LandingPage };
