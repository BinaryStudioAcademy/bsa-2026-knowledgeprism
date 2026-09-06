import { type AskPrismSourceDto } from "@knowledgeprism/types";
import { type JSX, useCallback } from "react";

import { Icon } from "~/components/components.js";
import { DataStatus } from "~/lib/enums/enums.js";
import { type ValueOf } from "~/lib/types/types.js";

const EMPTY_COUNT = 0;
const NO_INFO_TEXT = "No info";

type Properties = {
	answer: null | string;
	dataStatus: ValueOf<typeof DataStatus>;
	onSourceSelect?: ((source: AskPrismSourceDto) => void) | undefined;
	query?: string;
	sources: AskPrismSourceDto[];
};

const PrismAvatar = (): JSX.Element => (
	<div className="flex size-[26px] shrink-0 items-center justify-center rounded-[7px] bg-accent text-white shadow-2xs transition-transform duration-200">
		<svg fill="none" height="14" viewBox="0 0 44 44" width="14">
			<polygon fill="rgba(255,255,255,.6)" points="22,4 22,40 4,40" />
			<polygon fill="#fff" points="22,4 40,40 22,40" />
		</svg>
	</div>
);

const AnswerCard = ({
	answer,
	dataStatus,
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

	const isNoInfo =
		answer?.trim() === NO_INFO_TEXT ||
		(Boolean(answer) &&
			sources.length === EMPTY_COUNT &&
			answer?.toLowerCase().includes("no info"));

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

			{/* Assistant Thinking State with subtle pulse */}
			{dataStatus === DataStatus.PENDING && (
				<div className="flex items-center gap-3 transition-opacity duration-300 animate-fade-in">
					<div className="animate-pulse">
						<PrismAvatar />
					</div>
					<span className="animate-pulse font-sans text-sm text-text-faint">
						Prism is thinking…
					</span>
				</div>
			)}

			{/* No Info Notice */}
			{dataStatus === DataStatus.FULFILLED && isNoInfo && (
				<div className="flex gap-3 transition-all duration-300 animate-fade-in">
					<PrismAvatar />
					<div className="flex flex-col gap-1 text-sm text-text">
						<span className="font-medium text-text">No info</span>
						<p className="m-0 text-text-muted">
							Based on your knowledge base, no matching information was found
							for this question. Try rephrasing your question or checking
							project documents.
						</p>
					</div>
				</div>
			)}

			{/* Answer Card with Animated Citations */}
			{dataStatus === DataStatus.FULFILLED && !isNoInfo && answer && (
				<div className="flex gap-3 transition-all duration-300 animate-fade-in">
					<PrismAvatar />
					<div className="flex-1 space-y-3 font-sans text-sm leading-[1.65] text-text">
						<p className="m-0 whitespace-pre-line">{answer}</p>

						{/* Inline Citation Badges */}
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
