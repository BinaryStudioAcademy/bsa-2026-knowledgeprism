import { DocumentStatus } from "@knowledgeprism/constants";

import { type ValueOf } from "~/lib/types/types.js";

type CompactSuccessProperties = {
	currentStatus: "IDLE" | "UPLOADED" | ValueOf<typeof DocumentStatus>;
	hasError?: false;
	onCancel?: never;
	onFinish?: never;
	onPreview: () => void;
	onRetry?: never;
	variant: "compact";
};

type ErrorProperties = {
	currentStatus: "IDLE" | "UPLOADED" | ValueOf<typeof DocumentStatus>;
	hasError: true;
	onCancel: () => void;
	onFinish?: never;
	onPreview?: never;
	onRetry: () => void;
	variant?: "compact" | "full";
};

type FullSuccessProperties = {
	currentStatus: "IDLE" | "UPLOADED" | ValueOf<typeof DocumentStatus>;
	hasError?: false;
	onCancel?: never;
	onFinish?: () => void;
	onPreview?: never;
	onRetry?: never;
	variant?: "full";
};

type InternalStatusProperties = {
	currentStatus: ValueOf<typeof DocumentStatus>;
	isError: boolean;
	percentage: number;
};

type InternalVariantProperties = InternalStatusProperties & Properties;

type Properties =
	CompactSuccessProperties | ErrorProperties | FullSuccessProperties;

export { type InternalVariantProperties, type Properties };
