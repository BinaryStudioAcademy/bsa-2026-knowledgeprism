import { type AskPrismSourceDto } from "@knowledgeprism/types";
import {
	type BaseSyntheticEvent,
	type ChangeEvent,
	type JSX,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useState,
} from "react";

import { Heading, Icon, Paragraph } from "~/components/components.js";
import { useAppDispatch, useAppSelector, useNavigate } from "~/hooks/hooks.js";
import { DataStatus } from "~/lib/enums/enums.js";

import { actions as askPrismActions } from "../../state/state.js";
import { AnswerCard } from "../answer-card/answer-card.js";
import { PromptButton } from "../prompt-button/prompt-button.js";

const QUESTION_PLACEHOLDER = "Ask anything about your knowledge base...";

const AskPrismView = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");

	const {
		answer,
		dataStatus,
		errorType,
		isSuggestionsLoading,
		query: submittedQuery,
		sources,
		suggestedQuestions,
	} = useAppSelector(({ askPrism }) => askPrism);

	const isLoading = dataStatus === DataStatus.PENDING;

	useEffect(() => {
		void dispatch(askPrismActions.loadSuggestedQuestions());
	}, [dispatch]);

	const handleQueryChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setQuery(event.target.value);
		},
		[],
	);

	const handleSubmit = useCallback(
		(event?: BaseSyntheticEvent): void => {
			event?.preventDefault();
			const trimmedQuery = query.trim();

			if (!trimmedQuery || isLoading) {
				return;
			}

			void dispatch(askPrismActions.askQuestion({ query: trimmedQuery }));
			setQuery("");
		},
		[dispatch, isLoading, query],
	);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLInputElement>): void => {
			if (event.key !== "Enter") {
				return;
			}

			event.preventDefault();
			handleSubmit();
		},
		[handleSubmit],
	);

	const handlePromptClick = useCallback(
		(prompt: string): void => {
			if (isLoading) {
				return;
			}

			setQuery(prompt);
			void dispatch(askPrismActions.askQuestion({ query: prompt }));
		},
		[dispatch, isLoading],
	);

	const handleRetry = useCallback((): void => {
		if (!submittedQuery) {
			return;
		}

		void dispatch(askPrismActions.askQuestion({ query: submittedQuery }));
	}, [dispatch, submittedQuery]);

	const handleSourceSelect = useCallback(
		(source: AskPrismSourceDto): void => {
			void navigate(`/knowledge#${String(source.nodeId)}`);
		},
		[navigate],
	);

	return (
		<div className="mx-auto flex w-full max-w-[680px] flex-col gap-6 px-4 pt-8 pb-48">
			<div className="flex flex-col gap-1.5 border-b border-border pb-4">
				<div className="flex items-center gap-2 text-accent">
					<Icon name="ask-prism" size={24} />
					<Heading level="3">Ask Prism</Heading>
				</div>
				<Paragraph className="text-text-muted">
					AI-powered semantic search across all knowledge nodes and documents.
				</Paragraph>
			</div>

			<div className="min-h-[220px] flex-1">
				<AnswerCard
					answer={answer}
					dataStatus={dataStatus}
					errorType={errorType}
					onRetry={handleRetry}
					onSourceSelect={handleSourceSelect}
					query={submittedQuery}
					sources={sources}
				/>
			</div>

			<div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-none tablet:left-14 desktop:left-58">
				<div className="pointer-events-auto mx-auto flex w-full max-w-[680px] flex-col gap-2 bg-bg px-4 pt-2 pb-6">
					<div className="flex flex-wrap items-center gap-1.5">
						<span className="font-sans text-xs text-text-faint">
							Suggested questions:
						</span>
						{isSuggestionsLoading ? (
							<div className="flex gap-2 animate-pulse">
								<span className="h-6 w-28 rounded-md bg-surface" />
								<span className="h-6 w-36 rounded-md bg-surface" />
							</div>
						) : (
							suggestedQuestions.map((prompt) => (
								<PromptButton
									isDisabled={isLoading}
									key={prompt}
									onClick={handlePromptClick}
									prompt={prompt}
								/>
							))
						)}
					</div>

					<form
						className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface p-2 shadow-xs transition-all duration-200 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/15"
						onSubmit={handleSubmit}
					>
						<span className="ml-2 text-text-faint transition-colors duration-200">
							<Icon name="search" size={16} />
						</span>
						<input
							className="flex-1 border-0 bg-transparent font-sans text-sm text-text placeholder:text-text-faint focus:outline-hidden"
							onChange={handleQueryChange}
							onKeyDown={handleKeyDown}
							placeholder={QUESTION_PLACEHOLDER}
							type="text"
							value={query}
						/>
						<button
							className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-accent text-white shadow-2xs transition-all duration-200 hover:scale-105 hover:bg-accent-hover active:scale-95 disabled:scale-100 disabled:opacity-40"
							disabled={!query.trim() || isLoading}
							title="Send question"
							type="submit"
						>
							<Icon name="send" size={14} />
						</button>
					</form>

					<div className="flex items-center justify-between font-sans text-[11px] text-text-faint">
						<span>Prism retrieves verified facts from the knowledge tree.</span>
						<span>Enter to send</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export { AskPrismView };
