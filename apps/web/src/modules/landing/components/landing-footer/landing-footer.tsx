import { LANDING_SECTION_CONTAINER_CLASS } from "~/modules/landing/libs/constants.js";

import { LANDING_FOOTER_COPY } from "./libs/constants.js";

const LandingFooter: React.FC = () => (
	<footer className="border-t border-border">
		<div
			className={`${LANDING_SECTION_CONTAINER_CLASS} flex flex-wrap items-center justify-between gap-3 py-7`}
		>
			<span className="font-mono text-[12px] text-text-faint">
				{LANDING_FOOTER_COPY.copyright}
			</span>
			<nav aria-label="Footer" className="flex gap-6">
				{LANDING_FOOTER_COPY.links.map((link) => (
					<a
						className="rounded-sm text-[12.5px] text-text-muted focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35"
						href={link.href}
						key={link.label}
					>
						{link.label}
					</a>
				))}
			</nav>
		</div>
	</footer>
);

export { LandingFooter };
