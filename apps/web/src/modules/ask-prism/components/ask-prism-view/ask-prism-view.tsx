import { type AskPrismSourceDto } from "@knowledgeprism/types";
import {
	type BaseSyntheticEvent,
	type ChangeEvent,
	type JSX,
	type KeyboardEvent,
	type MouseEvent,
	useCallback,
	useState,
} from "react";

import { Heading, Icon, Paragraph } from "~/components/components.js";
import { useAppDispatch, useAppSelector, useNavigate } from "~/hooks/hooks.js";
import { DataStatus } from "~/lib/enums/enums.js";

import { actions as askPrismActions } from "../../state/state.js";
import { AnswerCard } from "../answer-card/answer-card.js";

const QUESTION_PLACEHOLDER = "Ask anything about your knowledge base...";

const SAMPLE_PROMPTS = [
	"What are the validation rules for user password?",
	"How does knowledge base integration work?",
	"What are the roles and permissions in a project?",
] as const;

const AskPrismView = (): JSX.Element => {
	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");

	const {
		answer,
		dataStatus,
		query: submittedQuery,
		sources,
	} = useAppSelector(({ askPrism }) => askPrism);

	const isLoading = dataStatus === DataStatus.PENDING;

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
		(event: MouseEvent<HTMLButtonElement>): void => {
			const prompt = event.currentTarget.dataset["prompt"];

			if (prompt) {
				setQuery(prompt);
			}
		},
		[],
	);

	const handleSourceSelect = useCallback(
		(source: AskPrismSourceDto): void => {
			void navigate(`/knowledge#${String(source.nodeId)}`);
		},
		[navigate],
	);

	return (
		<div className="mx-auto flex w-full max-w-[680px] flex-col gap-6 py-8">
			{/* Header */}
			<div className="flex flex-col gap-1.5 border-b border-border pb-4">
				<div className="flex items-center gap-2 text-accent">
					<Icon name="ask-prism" size={24} />
					<Heading level={3}>Ask Prism</Heading>
				</div>
				<Paragraph className="text-text-muted">
					AI-powered semantic search across all knowledge nodes and documents.
				</Paragraph>
			</div>

			{/* Q&A Conversation Area */}
			<div className="min-h-[220px] flex-1">
				<AnswerCard
					answer={answer}
					dataStatus={dataStatus}
					onSourceSelect={handleSourceSelect}
					query={submittedQuery}
					sources={sources}
				/>
			</div>

			{/* Input Bar pinned to bottom container */}
			<div className="flex flex-col gap-2">
				{/* Example Suggestion Pills */}
				<div className="flex flex-wrap items-center gap-1.5">
					<span className="font-sans text-xs text-text-faint">
						Suggestions:
					</span>
					{SAMPLE_PROMPTS.map((prompt) => (
						<button
							className="max-w-[220px] cursor-pointer truncate rounded-md border border-border bg-surface px-2.5 py-1 font-sans text-xs text-text-muted shadow-2xs transition-all duration-200 hover:scale-[1.02] hover:border-accent hover:bg-success-bg/40 hover:text-accent active:scale-95"
							data-prompt={prompt}
							key={prompt}
							onClick={handlePromptClick}
							type="button"
						>
							{prompt}
						</button>
					))}
				</div>

				{/* Input box with focus ring transition */}
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

				{/* Footer helper text */}
				<div className="flex items-center justify-between font-sans text-[11px] text-text-faint">
					<span>Prism can make mistakes. Verify important information.</span>
					<span>Enter to send</span>
				</div>
			</div>
		</div>
	);
};

export { AskPrismView };
