import { useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { useCallback } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { FloatingMark } from "../floating-mark/floating-mark.js";
import { CTA_SECTION_CLASS, CTA_SECTION_COPY } from "./libs/constants.js";

const CtaSection: React.FC = () => {
	const navigate = useNavigate();

	const handleSignUp = useCallback((): void => {
		void navigate(AppRoute.SIGN_UP);
	}, [navigate]);

	return (
		<section className={CTA_SECTION_CLASS.ROOT}>
			<FloatingMark className={CTA_SECTION_CLASS.MARK} />
			<div className={CTA_SECTION_CLASS.INNER}>
				<h2 className={CTA_SECTION_CLASS.HEADING}>
					{CTA_SECTION_COPY.heading}
				</h2>
				<p className={CTA_SECTION_CLASS.BODY}>{CTA_SECTION_COPY.body}</p>
				<div className={CTA_SECTION_CLASS.ACTIONS}>
					<Button
						className={CTA_SECTION_CLASS.PRIMARY_BUTTON}
						onClick={handleSignUp}
						variant="primary"
					>
						{CTA_SECTION_COPY.primaryCTA}
					</Button>
					<Button
						className={CTA_SECTION_CLASS.SECONDARY_BUTTON}
						type="button"
						variant="secondary"
					>
						{CTA_SECTION_COPY.secondaryCTA}
					</Button>
				</div>
			</div>
		</section>
	);
};

export { CtaSection };
