import { type JSX } from "react";

import { Paragraph, ParagraphSize } from "~/components/components.js";

type CompactSuccessProperties = {
	hasError?: false;
	onCancel?: never;
	onPreview: () => void;
	onRetry?: never;
	variant: "compact";
};

type ErrorProperties = {
	hasError: true;
	onCancel: () => void;
	onPreview?: never;
	onRetry: () => void;
	variant?: "compact" | "full";
};

type FullSuccessProperties = {
	hasError?: false;
	onCancel?: never;
	onPreview?: never;
	onRetry?: never;
	variant?: "full";
};

type Properties =
	CompactSuccessProperties | ErrorProperties | FullSuccessProperties;

const LoadingState = (properties: Properties): JSX.Element => {
	const { hasError = false } = properties;

	if (hasError) {
		return (
			<div className="flex items-center justify-between gap-4 p-2">
				<Paragraph
					className="text-error font-medium"
					size={ParagraphSize.BODY_SMALL}
				>
					Processing failed
				</Paragraph>
				<div className="flex gap-2">
					<button
						className="rounded border border-border px-2 py-1 text-xs"
						onClick={properties.onRetry}
						type="button"
					>
						Retry
					</button>
					<button
						className="rounded border border-border px-2 py-1 text-xs"
						onClick={properties.onCancel}
						type="button"
					>
						Cancel
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex items-center justify-between gap-4 p-2">
			<Paragraph size={ParagraphSize.BODY_SMALL}>
				New knowledge is being processed...
			</Paragraph>
		</div>
	);
};

export { LoadingState };
