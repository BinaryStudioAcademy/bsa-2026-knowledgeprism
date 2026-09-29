import { type GlossaryTermResponseDto } from "@knowledgeprism/types";

import { Button, Loader, Modal } from "~/components/components.js";

import { RelatedTermChip } from "./related-term-chip.js";

const DEFAULT_TITLE = "Glossary term";
const EMPTY_LENGTH = 0;

type Properties = {
	canEdit: boolean;
	hasFailed: boolean;
	onClose: () => void;
	onDelete: () => void;
	onEdit: () => void;
	onSelectTerm: (id: number) => void;
	term: GlossaryTermResponseDto | null;
};

const GlossaryTermDetailsModal: React.FC<Properties> = ({
	canEdit,
	hasFailed,
	onClose,
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

		return (
			<div className="flex flex-col gap-6">
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
