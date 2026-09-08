import { type JSX } from "react";

import { Icon } from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { DocumentProcessingStatus } from "../libs/enums/enums.js";
import { type UploadedDocumentItem } from "../libs/types/types.js";

type Properties = {
	item: UploadedDocumentItem;
	onCancel: () => void;
	onRemove: () => void;
	onRetry: () => void;
};

const getStatusLabel = (
	status: ValueOf<typeof DocumentProcessingStatus>,
): string => {
	if (status === DocumentProcessingStatus.PROCESSING) {
		return "Processing…";
	}
	if (status === DocumentProcessingStatus.FAILED) {
		return "Processing failed";
	}
	return "Ready";
};

const getIconBgClass = (
	status: ValueOf<typeof DocumentProcessingStatus>,
): string => {
	if (status === DocumentProcessingStatus.FAILED) {
		return "bg-error/10 text-error";
	}
	if (status === DocumentProcessingStatus.SUCCESS) {
		return "bg-success/15 text-accent";
	}
	return "bg-accent/10 text-accent";
};

const DocumentRow = ({
	item,
	onCancel,
	onRemove,
	onRetry,
}: Properties): JSX.Element => {
	const isProcessing = item.status === DocumentProcessingStatus.PROCESSING;
	const isFailed = item.status === DocumentProcessingStatus.FAILED;
	const isSuccess = item.status === DocumentProcessingStatus.SUCCESS;

	const statusLabel = getStatusLabel(item.status);
	const iconBgClass = getIconBgClass(item.status);

	return (
		<div className="flex flex-col gap-2 rounded-lg border border-border bg-surface p-3.5 shadow-xs">
			<div className="flex items-center gap-3">
				<div
					className={getValidClassNames(
						"flex size-9 shrink-0 items-center justify-center rounded-md",
						iconBgClass,
					)}
				>
					<Icon name="file" size={16} />
				</div>

				<div className="min-w-0 flex-1">
					<div className="truncate text-sm font-medium text-text">
						{item.name}
					</div>
					<div className="flex items-center gap-2 text-xs text-text-muted">
						<span>{item.sizeLabel}</span>
						<span>•</span>
						<span
							className={getValidClassNames(
								isFailed && "font-medium text-error",
								isSuccess && "font-medium text-accent",
							)}
						>
							{statusLabel}
						</span>
					</div>
				</div>

				<div className="flex items-center gap-1.5">
					{isFailed && (
						<button
							aria-label="Retry processing"
							className="flex size-7 cursor-pointer items-center justify-center rounded-md text-text-muted hover:bg-
border-subtle
hover:text-text"
							onClick={onRetry}
							title="Retry"
							type="button"
						>
							<Icon name="chevron-down" size={14} />
						</button>
					)}

					<button
						aria-label={isProcessing ? "Cancel upload" : "Remove document"}
						className="flex size-7 cursor-pointer items-center justify-center rounded-md text-text-muted hover:bg-border-
subtle
hover:text-text"
						onClick={isProcessing ? onCancel : onRemove}
						title={isProcessing ? "Cancel" : "Remove"}
						type="button"
					>
						<Icon name="close" size={12} />
					</button>
				</div>
			</div>

			{isProcessing && (
				<div className="h-1 w-full overflow-hidden rounded-full bg-border-subtle">
					<div
						className="h-full bg-accent transition-all duration-300"
						style={{ width: `${String(item.progress)}%` }}
					/>
				</div>
			)}
		</div>
	);
};

export { DocumentRow };
