import { GlossaryTermOrigin } from "@knowledgeprism/constants";
import { type GlossaryTermResponseDto } from "@knowledgeprism/types";

import { Button, Loader, Modal } from "~/components/components.js";

import { AiTermBadge } from "../ai-term-badge/ai-term-badge.js";
import { RelatedTermChip } from "./related-term-chip.js";

const DEFAULT_TITLE = "Glossary term";
const EMPTY_LENGTH = 0;

type Properties = {
	canEdit: boolean;
	hasFailed: boolean;
	isConfirming: boolean;
	onClose: () => void;
	onConfirm: () => void;
	onDelete: () => void;
	onEdit: () => void;
	onSelectTerm: (id: number) => void;
	term: GlossaryTermResponseDto | null;
};

const GlossaryTermDetailsModal: React.FC<Properties> = ({
	canEdit,
	hasFailed,
	isConfirming,
	onClose,
	onConfirm,
	onDelete,
	onEdit,
	onSelectTerm,
	term,
}: Properties) => {
	const renderBody = (): React.ReactNode => {
		if (hasFailed) {
			return (
				<p className="text-sm text-text-muted">
					This term could not be loaded.
				</p>
			);
		}

		if (!term) {
			return (
				<div className="flex justify-center py-6">
					<Loader size="md" />
				</div>
			);
		}

		const isAddedByAi = term.origin === GlossaryTermOrigin.AI;

		return (
			<div className="flex flex-col gap-6">
				{isAddedByAi && (
					<div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
						<AiTermBadge />
						<span>
							{term.sourceDocumentName
								? `From "${term.sourceDocumentName}". Check it and confirm, edit or delete it.`
								: "Check it and confirm, edit or delete it."}
						</span>
					</div>
				)}

				<p className="whitespace-pre-line break-words text-[14px] leading-[1.65] text-text">
					{term.definition}
				</p>

				<div>
					<h3 className="mb-2 font-sans text-xs font-medium uppercase tracking-[0.04em] text-text-muted">
						Related terms
					</h3>
					{term.relatedTerms.length === EMPTY_LENGTH ? (
						<p className="text-sm text-text-faint">None</p>
					) : (
						<div className="flex flex-wrap gap-2">
							{term.relatedTerms.map((relatedTerm) => (
								<RelatedTermChip
									key={relatedTerm.id}
									onSelect={onSelectTerm}
									term={relatedTerm}
								/>
							))}
						</div>
					)}
				</div>

				{canEdit && (
					<div className="flex justify-end gap-3 border-t border-border-subtle pt-4">
						<Button onClick={onDelete} variant="secondary">
							Delete
						</Button>
						{isAddedByAi && (
							<Button
								isLoading={isConfirming}
								onClick={onConfirm}
								variant="secondary"
							>
								Confirm
							</Button>
						)}
						<Button onClick={onEdit}>Edit</Button>
					</div>
				)}
			</div>
		);
	};

	return (
		<Modal
			hasCloseButton
			isFullScreenOnMobile
			isOpen
			onClose={onClose}
			size="large"
			title={term?.name ?? DEFAULT_TITLE}
		>
			{renderBody()}
		</Modal>
	);
};

export { GlossaryTermDetailsModal };
