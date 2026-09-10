import { type JSX, useEffect, useState } from "react";
import { tv, type VariantProps } from "tailwind-variants";

import {
	Button,
	Heading,
	Icon,
	Loader,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { type ValueOf } from "~/lib/types/types.js";

// TODO: Delete this mock object when backend is connected and import the real DocumentStatus from "@knowledgeprism/constants"
const DocumentStatus = {
	EXTRACTED: "EXTRACTED",
	EXTRACTING: "EXTRACTING",
	PARSED: "PARSED",
	PROCESSING: "PROCESSING",
	UPLOADED: "UPLOADED",
} as const;

// TODO: Delete these mock timer constants when backend is connected
const INITIAL_STATUS_INDEX = 0;
const MOCK_TIMER_DELAY_MS = 2000;
const STATUS_INDEX_INCREMENT = 1;

const STATUS_PROGRESSION = [
	DocumentStatus.UPLOADED,
	DocumentStatus.PROCESSING,
	DocumentStatus.PARSED,
	DocumentStatus.EXTRACTING,
	DocumentStatus.EXTRACTED,
];

const stepStyles = tv({
	slots: {
		base: "flex items-center gap-3 transition-opacity duration-300",
		iconContainer: "flex h-5 w-5 shrink-0 items-center justify-center",
		label: "text-sm font-medium",
	},
	variants: {
		status: {
			active: {
				base: "opacity-100",
				label: "text-accent-lighter",
			},
			done: {
				base: "opacity-100",
				label: "text-accent font-bold",
			},
			error: {
				base: "opacity-100",
				label: "text-error font-bold",
			},
			pending: {
				base: "opacity-100",
				label: "text-text-faint",
			},
		},
	},
});

type LoadingStepProperties = {
	label: string;
	status: VariantProps<typeof stepStyles>["status"];
};

const LoadingStep = ({ label, status }: LoadingStepProperties): JSX.Element => {
	const { base, iconContainer, label: labelStyle } = stepStyles({ status });

	return (
		<div className={base()}>
			<div className={iconContainer()}>
				{status === "done" && (
					<span className="text-accent">
						<Icon name="checkbox-tick" size={16} />
					</span>
				)}
				{status === "error" && (
					<span className="text-error">
						<Icon name="close" size={16} />
					</span>
				)}
				{(status === "active" || status === "pending") && (
					<div className="size-4 rounded-full border border-border shadow-sm" />
				)}
			</div>
			<span className={labelStyle()}>{label}</span>
		</div>
	);
};

// TODO: Add `currentStatus: ValueOf<typeof DocumentStatus>` passed down from TanStack Query
type ErrorProperties = {
	hasError: true;
	onCancel: () => void;
	onRetry: () => void;
};

type Properties = ErrorProperties | SuccessProperties;

type SuccessProperties = {
	hasError?: false;
	onCancel?: never;
	onRetry?: never;
};

const AddKnowledgeLoadingState = ({
	hasError = false,
	onCancel,
	onRetry,
}: Properties): JSX.Element => {
	// TODO: Delete this mock state and use the `currentStatus` prop from TanStack Query instead
	const [currentStatusIndex, setCurrentStatusIndex] =
		useState(INITIAL_STATUS_INDEX);

	const currentStatus = STATUS_PROGRESSION[currentStatusIndex] as ValueOf<
		typeof DocumentStatus
	>;

	// TODO: Delete this entire useEffect mock timer when backend is connected
	useEffect(() => {
		if (hasError || currentStatus === DocumentStatus.EXTRACTED) {
			return;
		}

		const timer = setTimeout(() => {
			setCurrentStatusIndex((previous) => previous + STATUS_INDEX_INCREMENT);
		}, MOCK_TIMER_DELAY_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [currentStatus, hasError]);

	const getStepStatus = (
		activeStatuses: ValueOf<typeof DocumentStatus>[],
		doneStatus: ValueOf<typeof DocumentStatus>,
	): "active" | "done" | "error" | "pending" => {
		const targetIndex = STATUS_PROGRESSION.indexOf(doneStatus);
		if (currentStatusIndex > targetIndex) {
			return "done";
		}
		if (activeStatuses.includes(currentStatus)) {
			return hasError ? "error" : "active";
		}
		return "pending";
	};

	return (
		<div className="flex w-full max-w-lg flex-col items-center justify-center rounded-lg p-10 text-center">
			<div className="mb-6">
				{hasError ? (
					<div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-error-bg text-error">
						<Icon name="close" size={24} />
					</div>
				) : (
					<Loader size="lg" />
				)}
			</div>

			<Heading className="mb-2" level={"1"}>
				{hasError ? "Processing failed" : "Analysing your content"}
			</Heading>
			<Paragraph
				className="mb-8 text-text-muted"
				size={ParagraphSize.BODY_SMALL}
			>
				{hasError
					? "Something went wrong. Please try again."
					: "This usually takes a few seconds"}
			</Paragraph>

			<div className="flex w-full max-w-[200px] flex-col gap-4 text-left">
				<LoadingStep
					label="Processing given data"
					status={getStepStatus(
						[DocumentStatus.UPLOADED, DocumentStatus.PROCESSING],
						DocumentStatus.PROCESSING,
					)}
				/>
				<LoadingStep
					label="Chunking & embedding"
					status={getStepStatus([DocumentStatus.PARSED], DocumentStatus.PARSED)}
				/>
				<LoadingStep
					label="Extracting knowledge"
					status={getStepStatus(
						[DocumentStatus.EXTRACTING],
						DocumentStatus.EXTRACTING,
					)}
				/>
			</div>

			<div className="mt-8 flex min-h-[44px] w-full justify-center gap-3">
				{hasError && (
					<>
						<Button className="min-w-28" onClick={onCancel} variant="secondary">
							Cancel
						</Button>
						<Button className="min-w-28" onClick={onRetry} variant="primary">
							Retry
						</Button>
					</>
				)}
			</div>
		</div>
	);
};

export { AddKnowledgeLoadingState };
