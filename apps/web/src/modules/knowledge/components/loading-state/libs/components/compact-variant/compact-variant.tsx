import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX } from "react";

import {
	Button,
	Icon,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { type ValueOf } from "~/lib/types/types.js";

import { FULL_PERCENTAGE } from "../../constants.js";
import { type InternalVariantProperties } from "../../types.js";

const getCompactStatusText = (
	status: ValueOf<typeof DocumentStatus>,
): string => {
	switch (status) {
		case DocumentStatus.EXTRACTED: {
			return "New knowledge is ready";
		}
		case DocumentStatus.EXTRACTING: {
			return "New knowledge is being extracted";
		}
		case DocumentStatus.PARSED: {
			return "New knowledge is being chunked";
		}
		case DocumentStatus.PROCESSING: {
			return "New knowledge is being processed";
		}
		case DocumentStatus.UPLOADED: {
			return "New knowledge is being uploaded";
		}
		default: {
			return "New knowledge is being processed";
		}
	}
};

const CompactVariant = ({
	currentStatus,
	isError,
	onCancel,
	onPreview,
	onRetry,
	percentage,
}: InternalVariantProperties): JSX.Element => {
	const isReady = currentStatus === DocumentStatus.EXTRACTED;

	return (
		<div className="flex w-full min-w-[260px] flex-col gap-2">
			{!isReady && (
				<div className="flex min-h-7 items-center justify-between">
					{isError ? (
						<Paragraph
							className="font-medium text-error"
							size={ParagraphSize.BODY_SMALL}
						>
							Processing failed
						</Paragraph>
					) : (
						<>
							<Paragraph size={ParagraphSize.BODY_SMALL}>
								{getCompactStatusText(currentStatus)}
							</Paragraph>
							<Paragraph size={ParagraphSize.BODY_SMALL}>
								{percentage}%
							</Paragraph>
						</>
					)}

					{isError && (
						<div className="flex items-center gap-2">
							<Button
								aria-label="Retry"
								className="size-7 p-0"
								onClick={onRetry}
								variant="icon"
							>
								<Icon name="refresh" size={14} />
							</Button>
							<Button
								aria-label="Cancel"
								className="size-7 p-0"
								onClick={onCancel}
								variant="icon"
							>
								<Icon name="close" size={14} />
							</Button>
						</div>
					)}
				</div>
			)}
			{!isReady && (
				<div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
					<div
						className={`h-full transition-all duration-300 ${isError ? "bg-error" : "bg-accent"}`}
						style={{
							width: `${String(isError ? FULL_PERCENTAGE : percentage)}%`,
						}}
					/>
				</div>
			)}

			{isReady && (
				<Button
					className="w-full sm:w-fit sm:self-end"
					onClick={onPreview}
					variant="secondary"
				>
					Preview is ready
				</Button>
			)}
		</div>
	);
};

export { CompactVariant };
