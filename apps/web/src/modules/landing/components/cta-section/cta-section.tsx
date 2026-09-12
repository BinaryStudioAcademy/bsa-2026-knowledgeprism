import { useNavigate } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { useCallback } from "~/hooks/hooks.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { FloatingMark } from "../floating-mark/floating-mark.js";
import { CTA_SECTION_COPY } from "./libs/constants.js";

const CtaSection: React.FC = () => {
	const navigate = useNavigate();

	const handleSignUp = useCallback((): void => {
		void navigate(AppRoute.SIGN_UP);
	}, [navigate]);

	return (
		<section className="relative overflow-hidden bg-primary">
			<FloatingMark className="pointer-events-none absolute left-[8%] top-[14%] size-[30px] text-primary-fg/[0.15]" />
			<div className="relative mx-auto max-w-[760px] px-[clamp(20px,5vw,40px)] py-[clamp(64px,9vw,120px)] text-center">
				<h2 className="mb-4 font-serif text-[clamp(28px,4vw,42px)] font-normal leading-[1.15] text-primary-fg">
					{CTA_SECTION_COPY.heading}
				</h2>
				<p className="mx-auto mb-8 max-w-[520px] text-[15.5px] leading-[1.65] text-primary-fg/65">
					{CTA_SECTION_COPY.body}
				</p>
				<div className="flex flex-wrap justify-center gap-3.5">
					<Button
						className="bg-primary-fg text-primary hover:bg-success-bg"
						onClick={handleSignUp}
						variant="primary"
					>
						{CTA_SECTION_COPY.primaryCTA}
					</Button>
				</div>
			</div>
		</section>
	);
};

export { CtaSection };
