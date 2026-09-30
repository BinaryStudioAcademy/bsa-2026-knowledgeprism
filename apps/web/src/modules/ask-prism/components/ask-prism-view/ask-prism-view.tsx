import { type AskPrismSourceDto } from "@knowledgeprism/types";
import {
	type BaseSyntheticEvent,
	type ChangeEvent,
	type JSX,
	type KeyboardEvent,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { generatePath, useNavigate, useParams } from "react-router-dom";

import { Heading, Icon, Paragraph } from "~/components/components.js";
import { useAppDispatch, useAppSelector } from "~/hooks/hooks.js";
import { AppRoute, DataStatus } from "~/lib/enums/enums.js";

import { DEFAULT_SUGGESTED_QUESTIONS } from "../../libs/constants.js";
import {
	actions as askPrismActions,
	type AskPrismMessage,
} from "../../state/state.js";
import { AnswerCard } from "../answer-card/answer-card.js";
import { PromptButton } from "../prompt-button/prompt-button.js";

const EMPTY_COUNT = 0;
const QUESTION_PLACEHOLDER = "Ask anything about your knowledge base...";

const AskPrismView = (): JSX.Element => {
	const { projectId } = useParams<{ projectId: string }>();
	const numericProjectId = Number(projectId);

	const dispatch = useAppDispatch();
	const navigate = useNavigate();
	const [query, setQuery] = useState("");
	const messagesEndReference = useRef<HTMLDivElement>(null);

	const {
		conversationsByProject,
		currentProjectId,
		isSuggestionsLoading,
		suggestedQuestions,
	} = useAppSelector(({ askPrism }) => askPrism);

	const isCurrentProject = currentProjectId === numericProjectId;
	const isSuggestionsActuallyLoading =
		!isCurrentProject || isSuggestionsLoading;

	const messages = useMemo(() => {
		return numericProjectId
			? (conversationsByProject[numericProjectId] ?? [])
			: [];
	}, [conversationsByProject, numericProjectId]);

	const isLoading = messages.some(
		(message) => message.dataStatus === DataStatus.PENDING,
	);

	useEffect(() => {
		if (!numericProjectId) {
			return;
		}

		dispatch(askPrismActions.initProject({ projectId: numericProjectId }));
		void dispatch(
			askPrismActions.loadSuggestedQuestions({ projectId: numericProjectId }),
		);
	}, [dispatch, numericProjectId]);

	useEffect(() => {
		messagesEndReference.current?.scrollIntoView({ behavior: "smooth" });
	}, [isLoading, messages.length]);

	const handleClearChat = useCallback((): void => {
		if (!numericProjectId) {
			return;
		}

		dispatch(askPrismActions.clearHistory({ projectId: numericProjectId }));
	}, [dispatch, numericProjectId]);

	const handleQueryChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>): void => {
			setQuery(event.target.value);
		},
		[],
	);

	const submitQuestion = useCallback(
		(nextQuery: string): void => {
			const trimmedQuery = nextQuery.trim();

			if (!trimmedQuery || isLoading || !numericProjectId) {
				return;
			}

			void dispatch(
				askPrismActions.askQuestion({
					projectId: numericProjectId,
					query: trimmedQuery,
				}),
			);
			setQuery("");
		},
		[dispatch, isLoading, numericProjectId],
	);

	const handleSubmit = useCallback(
		(event?: BaseSyntheticEvent): void => {
			event?.preventDefault();
			submitQuestion(query);
		},
		[query, submitQuestion],
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
			submitQuestion(prompt);
		},
		[submitQuestion],
	);

	const handleRetry = useCallback(
		(message: AskPrismMessage) => (): void => {
			if (!numericProjectId) {
				return;
			}

			void dispatch(
				askPrismActions.askQuestion({
					messageId: message.id,
					projectId: numericProjectId,
					query: message.query,
				}),
			);
		},
		[dispatch, numericProjectId],
	);

	const handleSourceSelect = useCallback(
		(source: AskPrismSourceDto): void => {
			if (!projectId) {
				return;
			}

			const knowledgeTreePath = generatePath(AppRoute.PROJECT_KNOWLEDGE_TREE, {
				projectId,
			});

			const targetUrl = source.nodeId
				? `${knowledgeTreePath}?nodeId=${String(source.nodeId)}`
				: knowledgeTreePath;

			void navigate(targetUrl);
		},
		[navigate, projectId],
	);

	const visibleSuggestedQuestions = useMemo(() => {
		const normalizedAskedQueries = new Set(
			messages.map((item) => item.query.trim().toLowerCase()).filter(Boolean),
		);

		const remainingCustomSuggestions = suggestedQuestions.filter(
			(prompt) => !normalizedAskedQueries.has(prompt.trim().toLowerCase()),
		);

		if (remainingCustomSuggestions.length > EMPTY_COUNT) {
			return remainingCustomSuggestions;
		}

		return DEFAULT_SUGGESTED_QUESTIONS.filter(
			(prompt) => !normalizedAskedQueries.has(prompt.trim().toLowerCase()),
		);
	}, [messages, suggestedQuestions]);

	return (
		<div className="mx-auto flex h-full w-full max-w-[680px] min-h-0 flex-col px-4 pt-6 tablet:pt-8 desktop:max-w-4xl desktop:px-6">
			<div className="flex shrink-0 items-center justify-between border-b border-border pb-4">
				<div className="flex flex-col gap-1.5">
					<div className="flex items-center gap-2 text-accent">
						<Icon name="ask-prism" size={24} />
						<Heading level="3">Ask Prism</Heading>
					</div>
					<Paragraph className="text-text-muted">
						AI-powered semantic search across all knowledge nodes and documents.
					</Paragraph>
				</div>

				{messages.length > EMPTY_COUNT && (
					<button
						aria-label="Clear chat history"
						className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 font-sans text-xs font-medium text-text-muted shadow-2xs transition-all duration-200 hover:border-accent hover:bg-secondary/60 hover:text-accent active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
						disabled={isLoading}
						onClick={handleClearChat}
						title="Clear chat history"
						type="button"
					>
						<Icon name="refresh" size={13} />
						<span>Clear chat</span>
					</button>
				)}
			</div>

			<div className="min-h-0 flex-1 overflow-y-auto py-4">
				{messages.length === EMPTY_COUNT ? (
					<div className="flex h-full flex-col items-center justify-center gap-3 text-center text-text-muted">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/80 text-accent">
							<Icon name="prism" size={24} />
						</div>
						<div className="flex max-w-sm flex-col gap-1">
							<span className="font-sans text-sm font-medium text-text">
								How can Prism help you today?
							</span>
							<span className="font-sans text-xs text-text-faint">
								Ask questions about your project documents, architecture, or
								requirements.
							</span>
						</div>
					</div>
				) : (
					<div className="flex flex-col gap-6">
						{messages.map((message) => (
							<AnswerCard
								answer={message.answer}
								dataStatus={message.dataStatus}
								errorType={message.errorType}
								key={message.id}
								onRetry={handleRetry(message)}
								onSourceSelect={handleSourceSelect}
								query={message.query}
								sources={message.sources}
							/>
						))}
						<div ref={messagesEndReference} />
					</div>
				)}
			</div>

			<div className="shrink-0 bg-bg pt-2 pb-6">
				<div className="flex flex-col gap-2">
					{(isSuggestionsActuallyLoading ||
						visibleSuggestedQuestions.length > EMPTY_COUNT) && (
						<div className="flex flex-wrap items-center gap-1.5">
							<span className="font-sans text-xs text-text-faint">
								Suggested questions:
							</span>
							{isSuggestionsActuallyLoading ? (
								<div className="flex animate-pulse gap-2">
									<span className="h-6 w-28 rounded-md bg-surface" />
									<span className="h-6 w-36 rounded-md bg-surface" />
								</div>
							) : (
								visibleSuggestedQuestions.map((prompt) => (
									<PromptButton
										isDisabled={isLoading}
										key={prompt}
										onClick={handlePromptClick}
										prompt={prompt}
									/>
								))
							)}
						</div>
					)}

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
							aria-label="Send question"
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
