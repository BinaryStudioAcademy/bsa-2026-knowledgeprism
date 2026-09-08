import { type JSX } from "react";

import { Button, Icon } from "~/components/components.js";

import { type UploadedDocumentItem } from "../libs/types/types.js";

type Properties = {
	item: null | UploadedDocumentItem;
	onBack: () => void;
	onComplete: () => void;
};

const IntegrationPreview = ({
	item,
	onBack,
	onComplete,
}: Properties): JSX.Element => (
	<div className="flex flex-col gap-5">
		<div className="flex items-center justify-between border-b border-border pb-3">
			<div>
				<div className="text-sm font-medium text-text">Integration Preview</div>
				<div className="text-xs text-text-muted">
					Review proposed knowledge items before integrating into the Knowledge
					Base.
				</div>
			</div>
			<Button onClick={onBack} variant="ghost">
				Back to input
			</Button>
		</div>

		{item && (
			<div className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-xs">
				<Icon name="file" size={16} />
				<div className="min-w-0 flex-1 truncate font-medium text-text">
					{item.name}
				</div>
				<span className="rounded-sm bg-secondary px-2 py-0.5 text-text-muted">
					{item.sizeLabel}
				</span>
			</div>
		)}

		<div
			className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-bg py-10
text-
center"
		>
			<div className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
				<Icon name="knowledge-tree" size={18} />
			</div>
			<div className="text-sm font-medium text-text">
				Knowledge Proposals Ready
			</div>
			<div className="max-w-sm text-xs text-text-muted">
				Extracted blocks from your document are prepared for integration
				approval.
			</div>
		</div>

		<div className="flex justify-end pt-2">
			<Button onClick={onComplete}>Approve & Integrate</Button>
		</div>
	</div>
);

export { IntegrationPreview };
