import { type JSX } from "react";
import { createPortal } from "react-dom";

import {
	Button,
	Heading,
	Icon,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";

const CHECK_ICON_SIZE = 24;

type SuccessModalProperties = {
	isOpen: boolean;
	onAddMore: () => void;
	onGoToKnowledgeBase: () => void;
};

const SuccessModal = ({
	isOpen,
	onAddMore,
	onGoToKnowledgeBase,
}: SuccessModalProperties): JSX.Element | null => {
	if (!isOpen) {
		return null;
	}

	const modalContent = (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-xs">
			<div className="relative flex w-full max-w-lg flex-col items-center rounded-3xl bg-surface p-6 sm:p-10 text-center shadow-2xl">
				<div className="mb-5 flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full bg-success-bg text-accent">
					<Icon name="checkbox-tick" size={CHECK_ICON_SIZE} />
				</div>

				<Heading
					className="font-serif text-2xl sm:text-3xl font-bold leading-tight tracking-tight text-neutral-900"
					level="2"
				>
					Knowledge added
				</Heading>

				<Paragraph
					className="mt-3 max-w-md font-sans text-xs sm:text-sm leading-relaxed text-neutral-600"
					size={ParagraphSize.BODY_SMALL}
				>
					Your content has been processed and integrated into the knowledge
					base. The new sections are now available for browsing and search.
				</Paragraph>

				<div className="mt-6 flex w-full shrink-0 flex-col sm:flex-row items-center justify-center gap-3">
					<Button
						className="w-full sm:w-auto"
						onClick={onAddMore}
						variant="secondary"
					>
						+ Add more
					</Button>

					<Button
						className="w-full sm:w-auto"
						onClick={onGoToKnowledgeBase}
						variant="primary"
					>
						<Icon name="glossary" size={18} />
						<span>Go to Knowledge Base</span>
					</Button>
				</div>
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
};

export { SuccessModal };
