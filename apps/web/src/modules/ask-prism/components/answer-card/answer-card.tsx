import { type AskPrismSourceDto } from "@knowledgeprism/types";
import { type JSX, useCallback } from "react";

import { Icon } from "~/components/components.js";
import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

import { type AskPrismErrorType } from "../../state/state.js";
import { MarkdownContent } from "./markdown-content.js";
import { PrismAvatar } from "./prism-avatar.js";

const EMPTY_COUNT = 0;
const SOURCE_ICON_SIZE = 11;

type Properties = {
	answer: null | string;
	dataStatus: ValueOf<typeof DataStatus>;
	errorType?: AskPrismErrorType;
	onRetry?: () => void;
	onSourceSelect?: (source: AskPrismSourceDto) => void;
	query: string;
	sources: AskPrismSourceDto[];
};

const getUniqueSources = (
	sources: AskPrismSourceDto[],
): AskPrismSourceDto[] => {
	const seenSourceIds = new Set<string>();

	return sources.filter((source) => {
		const sourceId = String(source.id);

		if (seenSourceIds.has(sourceId)) {
			return false;
		}

		seenSourceIds.add(sourceId);

		return true;
	});
};

type SourceLabelProperties = {
	source: AskPrismSourceDto;
};

const SourceLabel = ({ source }: SourceLabelProperties): JSX.Element => {
	const hasDistinctSection = source.sectionTitle !== source.title;

	return (
		<>
			<span className="shrink-0 flex items-center">
				<Icon name="file" size={SOURCE_ICON_SIZE} />
			</span>
			<span className="min-w-0 truncate">{source.title}</span>
			{hasDistinctSection && (
				<>
					<span className="shrink-0 opacity-60">·</span>
					<span className="min-w-0 truncate opacity-85">
						{source.sectionTitle}
					</span>
				</>
			)}
		</>
	);
};

const AnswerCard = ({
	answer,
	dataStatus,
	errorType = null,
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

	const uniqueSources = getUniqueSources(sources);
	const isNotFound = errorType === "not_found";
	const isConnectionError =
		errorType === "connection" ||
		(dataStatus === DataStatus.REJECTED && !isNotFound);

	return (
		<div className="flex flex-col gap-6 transition-all duration-300 ease-out">
			{query && (
				<div className="flex justify-end animate-fade-in">
					<div className="max-w-[75%] wrap-break-word whitespace-pre-wrap rounded-[14px_14px_4px_14px] bg-primary px-4.5 py-3 font-sans text-sm text-primary-fg shadow-2xs transition-all duration-300">
						{query}
					</div>
				</div>
			)}

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

			{isNotFound && (
				<div className="flex gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-300 animate-fade-in">
					<PrismAvatar />
					<div className="flex flex-1 flex-col gap-1 font-sans text-sm">
						<span className="font-medium text-text">
							No relevant information found in the knowledge tree
						</span>
						<p className="m-0 text-text-muted">
							Prism couldn&apos;t find verified knowledge matching this query.
							Try rephrasing or asking about another topic in your project.
						</p>
					</div>
				</div>
			)}

			{dataStatus === DataStatus.FULFILLED && !isNotFound && answer && (
				<div className="flex gap-3 transition-all duration-300 animate-fade-in">
					<PrismAvatar />
					<div className="flex min-w-0 flex-1 flex-col gap-3 font-sans text-sm leading-relaxed text-text">
						<MarkdownContent content={answer} />

						{uniqueSources.length > EMPTY_COUNT && (
							<div className="flex flex-wrap items-center gap-1.5 pt-1">
								{uniqueSources.map((source) =>
									onSourceSelect ? (
										<button
											className="inline-flex min-w-0 max-w-full cursor-pointer items-center gap-1.5 rounded-full border border-accent/20 bg-success-bg px-2.5 py-0.5 font-sans text-[11px] font-medium text-accent shadow-2xs transition-colors duration-200 hover:border-accent hover:bg-accent hover:text-white"
											key={String(source.id)}
											onClick={handleSourceClick(source)}
											title={`Jump to ${source.sectionTitle}`}
											type="button"
										>
											<SourceLabel source={source} />
										</button>
									) : (
										<span
											className="inline-flex min-w-0 max-w-full items-center gap-1.5 rounded-full border border-accent/20 bg-success-bg px-2.5 py-0.5 font-sans text-[11px] font-medium text-accent shadow-2xs"
											key={String(source.id)}
										>
											<SourceLabel source={source} />
										</span>
									),
								)}
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export { AnswerCard };
