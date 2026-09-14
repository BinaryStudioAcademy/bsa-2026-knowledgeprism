import { type AskPrismSourceDto } from "@knowledgeprism/types";
import { type JSX, useCallback } from "react";

import { Icon } from "~/components/components.js";
import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { type AskPrismErrorType } from "../../state/ask-prism.slice.js";
import { PrismAvatar } from "./prism-avatar.js";

const EMPTY_COUNT = 0;

type Properties = {
	answer: null | string;
	dataStatus: ValueOf<typeof DataStatus>;
	errorType?: AskPrismErrorType;
	onRetry?: (() => void) | undefined;
	onSourceSelect?: ((source: AskPrismSourceDto) => void) | undefined;
	query?: string;
	sources: AskPrismSourceDto[];
};

const AnswerCard = ({
	answer,
	dataStatus,
	errorType,
	onRetry,
	onSourceSelect,
	query,
	sources,
}: Properties): JSX.Element | null => {
	const handleSourceClick = useCallback(
		(source: AskPrismSourceDto) => (): void => {
			onSourceSelect?.(source);
		},
		[onSourceSelect],
	);

	if (!answer && dataStatus === DataStatus.IDLE) {
		return null;
	}

	const isNotFound =
		errorType === "not_found" ||
		(dataStatus === DataStatus.FULFILLED &&
			sources.length === EMPTY_COUNT &&
			Boolean(answer) &&
			(answer?.toLowerCase().includes("not found") ||
				answer?.toLowerCase().includes("no info")));

	const isConnectionError =
		errorType === "connection" ||
		(dataStatus === DataStatus.REJECTED && !isNotFound);

	return (
		<div className="flex flex-col gap-6 transition-all duration-300 ease-out">
			{/* User Question Bubble */}
			{query && (
				<div className="flex justify-end animate-fade-in">
					<div className="max-w-[75%] rounded-[14px_14px_4px_14px] bg-primary px-4.5 py-3 font-sans text-sm text-primary-fg shadow-2xs transition-all duration-300">
						{query}
					</div>
				</div>
			)}

			{/* Assistant Thinking State */}
			{dataStatus === DataStatus.PENDING && (
				<div className="flex items-center gap-3 transition-opacity duration-300 animate-fade-in">
					<div className="animate-pulse">
						<PrismAvatar />
					</div>
					<span className="animate-pulse font-sans text-sm text-text-faint">
						Prism is searching knowledge tree…
					</span>
				</div>
			)}

			{/* Connection Error State */}
			{isConnectionError && (
				<div className="flex gap-3 rounded-xl border border-error/20 bg-error/5 p-4 transition-all duration-300 animate-fade-in">
					<PrismAvatar />
					<div className="flex flex-1 flex-col gap-1.5 font-sans text-sm text-text">
						<span className="font-medium text-error">Connection problem</span>
						<p className="m-0 text-text-muted">
							Unable to communicate with the Prism service. Please check your
							network connection and try again.
						</p>
						{onRetry && (
							<div className="pt-1">
								<button
									className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1 text-xs font-medium text-text shadow-2xs transition-all duration-200 hover:border-accent hover:text-accent active:scale-95"
									onClick={onRetry}
									type="button"
								>
									<span>Retry question</span>
								</button>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Not Found in Knowledge Tree State */}
			{isNotFound && (
				<div className="flex gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-300 animate-fade-in shadow-2xs">
					<PrismAvatar />
					<div className="flex flex-col gap-1.5 font-sans text-sm text-text">
						<span className="font-medium text-text">
							No relevant information found in the knowledge tree
						</span>
						<p className="m-0 text-text-muted">
							The knowledge base does not have verified information matching
							your query. Try rephrasing your question or uploading related
							documents to the project.
						</p>
					</div>
				</div>
			)}

			{/* Answer Card with Animated Citations */}
			{dataStatus === DataStatus.FULFILLED && !isNotFound && answer && (
				<div className="flex gap-3 transition-all duration-300 animate-fade-in">
					<PrismAvatar />
					<div className="flex-1 space-y-3 font-sans text-sm leading-[1.65] text-text">
						<p className="m-0 whitespace-pre-line">{answer}</p>

						{sources.length > EMPTY_COUNT && (
							<div className="flex flex-wrap items-center gap-1.5 pt-1">
								{sources.map((source) => (
									<button
										className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-accent/20 bg-success-bg px-2.5 py-0.5 font-sans text-[11px] font-medium text-accent shadow-2xs transition-all duration-200 hover:scale-[1.03] hover:border-accent hover:bg-accent hover:text-white active:scale-[0.98]"
										key={String(source.id)}
										onClick={handleSourceClick(source)}
										title={`Jump to ${source.sectionTitle}`}
										type="button"
									>
										<Icon name="file" size={11} />
										<span>{source.title}</span>
										<span className="opacity-60">·</span>
										<span className="opacity-85">{source.sectionTitle}</span>
									</button>
								))}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export { AnswerCard };
