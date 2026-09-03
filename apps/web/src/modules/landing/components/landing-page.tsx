import { HeroSection } from "./hero-section/hero-section.js";
import { LandingHeader } from "./landing-header/landing-header.js";

const LandingPage: React.FC = () => {
	return (
		<>
			<LandingHeader />
			<HeroSection />
		</>
	);
};

export { LandingPage };
