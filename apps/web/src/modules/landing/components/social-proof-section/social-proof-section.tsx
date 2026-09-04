import {
	SOCIAL_PROOF_LOGO_HEIGHT,
	SOCIAL_PROOF_LOGO_VIEW_BOX,
	SOCIAL_PROOF_LOGO_WIDTH,
	SOCIAL_PROOF_SECTION_CLASS,
	SOCIAL_PROOF_SECTION_COPY,
} from "./libs/constants.js";

type LogoProperties = {
	children: React.ReactNode;
};

const SocialProofLogo: React.FC<LogoProperties> = ({
	children,
}: LogoProperties) => (
	<svg
		aria-hidden="true"
		className={SOCIAL_PROOF_SECTION_CLASS.LOGO}
		fill="currentColor"
		height={SOCIAL_PROOF_LOGO_HEIGHT}
		viewBox={SOCIAL_PROOF_LOGO_VIEW_BOX}
		width={SOCIAL_PROOF_LOGO_WIDTH}
	>
		{children}
	</svg>
);

const SocialProofSection: React.FC = () => (
	<section className={SOCIAL_PROOF_SECTION_CLASS.ROOT}>
		<div className={SOCIAL_PROOF_SECTION_CLASS.INNER}>
			<p className={SOCIAL_PROOF_SECTION_CLASS.LABEL}>
				{SOCIAL_PROOF_SECTION_COPY.line}
			</p>
			<div className={SOCIAL_PROOF_SECTION_CLASS.LOGO_ROW}>
				<SocialProofLogo>
					<rect height="8" rx="2" width="24" x="0" y="8" />
					<rect height="16" rx="3" width="16" x="30" y="4" />
					<rect height="4" rx="2" width="36" x="52" y="10" />
				</SocialProofLogo>
				<SocialProofLogo>
					<circle cx="12" cy="12" r="9" />
					<rect height="12" rx="6" width="58" x="30" y="6" />
				</SocialProofLogo>
				<SocialProofLogo>
					<polygon points="12,2 24,22 0,22" />
					<rect height="8" rx="2" width="54" x="34" y="8" />
				</SocialProofLogo>
				<SocialProofLogo>
					<rect height="24" rx="12" width="24" x="0" y="0" />
					<rect height="20" rx="3" width="16" x="34" y="2" />
					<rect height="20" rx="3" width="16" x="58" y="2" />
				</SocialProofLogo>
				<SocialProofLogo>
					<rect height="16" rx="8" width="16" x="0" y="4" />
					<rect height="16" rx="8" width="16" x="24" y="4" />
					<rect height="8" rx="4" width="36" x="52" y="8" />
				</SocialProofLogo>
			</div>
		</div>
	</section>
);

export { SocialProofSection };
