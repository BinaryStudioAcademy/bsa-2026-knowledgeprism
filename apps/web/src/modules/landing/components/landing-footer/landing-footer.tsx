import { LANDING_FOOTER_CLASS, LANDING_FOOTER_COPY } from "./libs/constants.js";

const LandingFooter: React.FC = () => (
	<footer className={LANDING_FOOTER_CLASS.ROOT}>
		<div className={LANDING_FOOTER_CLASS.INNER}>
			<span className={LANDING_FOOTER_CLASS.COPYRIGHT}>
				{LANDING_FOOTER_COPY.copyright}
			</span>
			<nav aria-label="Footer" className={LANDING_FOOTER_CLASS.LINKS}>
				{LANDING_FOOTER_COPY.links.map((link) => (
					<a
						className={LANDING_FOOTER_CLASS.LINK}
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
