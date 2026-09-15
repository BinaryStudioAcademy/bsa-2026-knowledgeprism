import { DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "~/lib/types/types.js";

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

type InternalVariantProperties = Properties & {
	currentStatus: ValueOf<typeof DocumentStatus>;
	isError: boolean;
	percentage: number;
};

type Properties =
	CompactSuccessProperties | ErrorProperties | FullSuccessProperties;

export {
	type ErrorProperties,
	type InternalVariantProperties,
	type Properties,
	type CompactSuccessProperties as SuccessProperties,
};
