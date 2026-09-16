import { useCallback, useState } from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { Button } from "../button/button.js";
import { Modal } from "../modal/modal.js";
import { FOOTER_COPY } from "./libs/constants.js";
import { privacyPolicy } from "./privacy-policy.js";
import { TermsOfServices } from "./terms-of-service.js";

type LegalDocument = (typeof FOOTER_COPY.links)[number]["document"] | null;

const FOOTER_FOCUS_RING =
	"focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35";
const FOOTER_CONTAINER_CLASS =
	"mx-auto max-w-[1240px] px-[clamp(20px,5vw,40px)]";
const FOOTER_LINK_CLASS =
	"rounded-sm text-[12.5px] text-text-muted hover:text-text";
const SECTION_NUMBER_OFFSET = 1;

const DOCUMENT_CONTENT = {
	privacy: {
		sections: privacyPolicy,
		title: "Privacy Policy",
	},
	terms: {
		sections: TermsOfServices,
		title: "Terms of Service",
	},
} as const;

function Footer() {
	const currentYear = new Date().getFullYear();
	const [openDocument, setOpenDocument] = useState<LegalDocument>(null);

	const isModalOpen = openDocument !== null;
	const activeDocument = openDocument ?? "privacy";
	const { sections, title } = DOCUMENT_CONTENT[activeDocument];

	const handleOpenDocument = useCallback(
		(document: Exclude<LegalDocument, null>) => (): void => {
			setOpenDocument(document);
		},
		[],
	);

	const handleCloseModal = useCallback((): void => {
		setOpenDocument(null);
	}, []);

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
						© {currentYear} {FOOTER_COPY.copyright}
					</span>
					<nav
						aria-label="Footer"
						className={getValidClassNames(
							"order-1 flex gap-6",
							"tablet:order-none",
						)}
					>
						{FOOTER_COPY.links.map((link) => (
							<button
								className={getValidClassNames(
									FOOTER_LINK_CLASS,
									FOOTER_FOCUS_RING,
								)}
								key={link.label}
								onClick={handleOpenDocument(link.document)}
								type="button"
							>
								{link.label}
							</button>
						))}
					</nav>
				</div>
			</footer>

			<Modal
				hasCloseButton
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				size="large"
				title={title}
			>
				<div className="flex max-h-140 flex-col">
					<div className="flex flex-col gap-4 overflow-y-auto">
						{sections.map(({ answer, title: sectionTitle }, index) => (
							<section className="mb-2" key={sectionTitle}>
								<h3 className="mb-2 font-sans text-base font-medium">
									{index + SECTION_NUMBER_OFFSET}. {sectionTitle}
								</h3>

								<p className="text-sm leading-6 text-text-muted">{answer}</p>
							</section>
						))}
					</div>

					<div className="-mx-7 flex items-end justify-end border-t border-gray-300 bg-surface px-7 pt-4">
						<Button onClick={handleCloseModal} variant="primary">
							Close
						</Button>
					</div>
				</div>
			</Modal>
		</>
	);
}

export { Footer };
