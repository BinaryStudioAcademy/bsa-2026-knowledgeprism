import { useModal } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { Modal } from "../modal/modal.js";
import { FOOTER_COPY } from "./libs/constants.js";
import { privacyPolicy } from "./libs/privacy-policy.js";
import { termsOfService } from "./libs/terms-of-service.js";

const FOOTER_FOCUS_RING =
	"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35";
const FOOTER_CONTAINER_CLASS =
	"mx-auto max-w-[1240px] px-[clamp(20px,5vw,40px)]";
const FOOTER_LINK_CLASS =
	"rounded-sm text-[12.5px] text-text-muted hover:text-text";
const SECTION_NUMBER_OFFSET = 1;

const Footer: React.FC = () => {
	const {
		hideModal: hidePrivacyModal,
		isOpen: isPrivacyModalOpen,
		showModal: showPrivacyModal,
	} = useModal();
	const {
		hideModal: hideTermsModal,
		isOpen: isTermsModalOpen,
		showModal: showTermsModal,
	} = useModal();

	return (
		<>
			<footer className="border-t border-border">
				<div
					className={getValidClassNames(
						FOOTER_CONTAINER_CLASS,
						"flex flex-wrap items-center justify-between gap-3 py-7",
					)}
				>
					<span
						className={getValidClassNames(
							"order-2 font-mono text-[12px] text-text-faint",
							"tablet:order-none",
						)}
					>
						{FOOTER_COPY.copyright}
					</span>
					<nav
						aria-label="Footer"
						className={getValidClassNames(
							"order-1 flex gap-6",
							"tablet:order-none",
						)}
					>
						<button
							className={getValidClassNames(
								FOOTER_LINK_CLASS,
								FOOTER_FOCUS_RING,
							)}
							onClick={showPrivacyModal}
							type="button"
						>
							Privacy
						</button>
						<button
							className={getValidClassNames(
								FOOTER_LINK_CLASS,
								FOOTER_FOCUS_RING,
							)}
							onClick={showTermsModal}
							type="button"
						>
							Terms
						</button>
					</nav>
				</div>
			</footer>

			<Modal
				hasCloseButton
				isOpen={isPrivacyModalOpen}
				onClose={hidePrivacyModal}
				size="large"
				title="Privacy Policy"
			>
				<div className="flex flex-col gap-4">
					{privacyPolicy.map(({ answer, title }, index) => (
						<section key={title}>
							<h3 className="mb-2 font-sans text-base font-medium">
								{index + SECTION_NUMBER_OFFSET}. {title}
							</h3>
							<p className="text-sm leading-6 text-text-muted">{answer}</p>
						</section>
					))}
				</div>
			</Modal>

			<Modal
				hasCloseButton
				isOpen={isTermsModalOpen}
				onClose={hideTermsModal}
				size="large"
				title="Terms of Service"
			>
				<div className="flex flex-col gap-4">
					{termsOfService.map(({ answer, title }, index) => (
						<section key={title}>
							<h3 className="mb-2 font-sans text-base font-medium">
								{index + SECTION_NUMBER_OFFSET}. {title}
							</h3>
							<p className="text-sm leading-6 text-text-muted">{answer}</p>
						</section>
					))}
				</div>
			</Modal>
		</>
	);
};

export { Footer };
