import { useCallback, useState } from "react";

import { Button, Modal } from "../components.js";
import { privacyPolicy } from "./privacy-policy.js";
import { TermsOfServices } from "./terms-of-service.js";

type LegalDocument = "privacy" | "terms" | null;
const SECTION_NUMBER_OFFSET = 1;

function Footer() {
	const currentYear = new Date().getFullYear();

	const [openDocument, setOpenDocument] = useState<LegalDocument>(null);

	const isModalOpen = openDocument !== null;
	const isPrivacy = openDocument === "privacy";

	const documentTitle = isPrivacy ? "Privacy Policy" : "Terms of Service";
	const documentContent = isPrivacy ? privacyPolicy : TermsOfServices;

	const handleOpenPrivacy = useCallback((): void => {
		setOpenDocument("privacy");
	}, []);

	const handleOpenTerms = useCallback((): void => {
		setOpenDocument("terms");
	}, []);

	const handleCloseModal = useCallback((): void => {
		setOpenDocument(null);
	}, []);

	return (
		<>
			<footer className="flex w-full items-center justify-between bg-border px-[10%]">
				<p className="font-mono text-sm font-normal text-text-faint">
					© {currentYear} KnowledgePrism AI. Order from Chaos.
				</p>

				<div className="flex items-center gap-0 py-5">
					<Button
						className="bg-border text-text-muted hover:bg-border"
						onClick={handleOpenPrivacy}
					>
						Privacy
					</Button>

					<Button
						className="bg-border text-text-muted hover:bg-border"
						onClick={handleOpenTerms}
					>
						Terms
					</Button>
				</div>
			</footer>

			<Modal
				hasCloseButton
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				size="large"
				title={documentTitle}
			>
				<div className="flex max-h-140 flex-col">
					<div className="flex flex-col gap-4 overflow-y-auto">
						{documentContent.map(({ answer, title }, index) => (
							<section className="mb-2" key={title}>
								<h3 className="mb-2 font-sans text-base font-medium">
									{index + SECTION_NUMBER_OFFSET}. {title}
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
