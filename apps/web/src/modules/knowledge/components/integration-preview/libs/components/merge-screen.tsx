import { type JSX, type MouseEvent, useCallback, useState } from "react";

import {
	Button,
	Heading,
	Icon,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import {
	type ConflictResolution,
	type FieldConflict,
} from "~/modules/knowledge/libs/types/types.js";

const BOTH_SEPARATOR = "\n\n";
const CHECK_ICON_SIZE = 14;
const DUPLICATE_INCOMING_FIELD_MESSAGE =
	"Two conflicts cannot both apply incoming values to the same field on the same knowledge entry. Change at least one resolution to Keep Live Version.";
const FIRST_MATCH_INDEX = 0;
const MATCH_LABEL_OFFSET = 1;
const NEXT_MATCH_STEP = 1;
const NOT_FOUND_INDEX = -1;
const PREVIOUS_MATCH_STEP = -1;
const SECTIONS_LABEL = "sections to decide";
const SINGLE_MATCH_COUNT = 1;
const VALID_RESOLUTIONS: readonly ConflictResolution[] = [
	"both",
	"keep",
	"use-new",
] as const;

const HighlightedSpan = ({
	span,
	text,
}: {
	span: string;
	text: string;
}): JSX.Element => {
	const spanIndex =
		span.length === FIRST_MATCH_INDEX ? NOT_FOUND_INDEX : text.indexOf(span);

	if (spanIndex < FIRST_MATCH_INDEX) {
		return <>{text}</>;
	}

	const spanEnd = spanIndex + span.length;

	return (
		<>
			{text.slice(FIRST_MATCH_INDEX, spanIndex)}
			<mark className="rounded-sm bg-warning-bg px-0.5 text-text">{span}</mark>
			{text.slice(spanEnd)}
		</>
	);
};

type MergeScreenProperties = {
	cancelLabel: string;
	conflicts: FieldConflict[];
	isApplying: boolean;
	onCancel: () => void;
	onPublish: (resolvedConflicts: FieldConflict[]) => void;
	submitLabel: string;
};

const hasDuplicateIncomingFieldConflict = (
	conflicts: FieldConflict[],
): boolean => {
	const incomingFields = new Set<string>();

	for (const conflict of conflicts) {
		const isIncomingWrite =
			conflict.resolution === "use-new" || conflict.resolution === "both";

		if (!isIncomingWrite || conflict.matchedNodeId === null) {
			continue;
		}

		const key = `${String(conflict.matchedNodeId)}:${conflict.field}`;

		if (incomingFields.has(key)) {
			return true;
		}

		incomingFields.add(key);
	}

	return false;
};

const MergeScreen = ({
	cancelLabel,
	conflicts: initialConflicts,
	isApplying,
	onCancel,
	onPublish,
	submitLabel,
}: MergeScreenProperties): JSX.Element => {
	const [conflicts, setConflicts] = useState<FieldConflict[]>(() =>
		initialConflicts.map((conflict) => ({
			...conflict,
			resolution: conflict.resolution ?? "use-new",
		})),
	);
	const [validationError, setValidationError] = useState<null | string>(null);

	const handleResolveConflict = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			if (isApplying) {
				return;
			}

			const target = event.currentTarget;
			const conflictId = target.dataset["conflictId"];
			const rawResolution = target.dataset["resolution"] as ConflictResolution;
			const resolution = VALID_RESOLUTIONS.includes(rawResolution)
				? rawResolution
				: undefined;

			if (conflictId && resolution) {
				setValidationError(null);
				setConflicts((previousConflicts) =>
					previousConflicts.map((item) =>
						item.id === conflictId ? { ...item, resolution } : item,
					),
				);
			}
		},
		[isApplying],
	);

	const handleMatchStep = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			if (isApplying) {
				return;
			}

			const conflictId = event.currentTarget.dataset["conflictId"];
			const step = event.currentTarget.dataset["matchStep"];

			if (!conflictId || (step !== "next" && step !== "previous")) {
				return;
			}

			setConflicts((previousConflicts) => {
				const activeConflict = previousConflicts.find(
					(item) => item.id === conflictId,
				);

				if (!activeConflict) {
					return previousConflicts;
				}

				const matchCount =
					activeConflict.wordingMatches?.length ?? FIRST_MATCH_INDEX;

				if (matchCount <= SINGLE_MATCH_COUNT) {
					return previousConflicts;
				}

				const currentIndex = activeConflict.matchIndex ?? FIRST_MATCH_INDEX;
				const stepDelta =
					step === "next" ? NEXT_MATCH_STEP : PREVIOUS_MATCH_STEP;
				const nextIndex = (currentIndex + stepDelta + matchCount) % matchCount;

				const nextMatch = activeConflict.wordingMatches?.[nextIndex];
				const nextMatchedNodeId =
					nextMatch?.nodeId ?? activeConflict.matchedNodeId;

				return previousConflicts.map((item) => {
					if (item.changeId !== activeConflict.changeId) {
						return item;
					}

					if (item.field === "title") {
						return {
							...item,
							currentValue: nextMatch?.title ?? item.currentValue,
							matchedNodeId: nextMatchedNodeId,
							matchIndex: nextIndex,
						};
					}

					return {
						...item,
						currentValue: nextMatch?.content ?? item.currentValue,
						matchedNodeId: nextMatchedNodeId,
						matchIndex: nextIndex,
					};
				});
			});
		},
		[isApplying],
	);

	const handleConsolidatedPublish = useCallback((): void => {
		if (isApplying) {
			return;
		}

		if (hasDuplicateIncomingFieldConflict(conflicts)) {
			setValidationError(DUPLICATE_INCOMING_FIELD_MESSAGE);

			return;
		}

		onPublish(conflicts);
	}, [conflicts, isApplying, onPublish]);

	const hasAllResolved = conflicts.every((item) => Boolean(item.resolution));

	return (
		<div className="mx-auto flex h-full max-h-full w-full max-w-5xl flex-col justify-between gap-3 p-3 tablet:p-5 pb-2 tablet:pb-4 font-sans text-text overflow-hidden">
			<div className="flex shrink-0 flex-col gap-1.5 border-b border-border-subtle pb-2.5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<Heading
						className="font-serif text-lg tablet:text-2xl font-bold tracking-tight text-text leading-tight"
						level="2"
					>
						Decide on existing knowledge
					</Heading>
					<span className="inline-flex self-start sm:self-auto shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning-bg px-2.5 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wider text-warning whitespace-nowrap">
						{String(new Set(conflicts.map((item) => item.changeId)).size)}{" "}
						{SECTIONS_LABEL}
					</span>
				</div>
				<Paragraph
					className="text-text-muted font-sans text-xs tablet:text-sm"
					size={ParagraphSize.BODY_SMALL}
				>
					These sections overlap entries already in the knowledge base. Choose
					what to keep for each field before anything is published.
				</Paragraph>
				{validationError && (
					<Paragraph
						className="text-error font-sans text-xs tablet:text-sm"
						size={ParagraphSize.BODY_SMALL}
					>
						{validationError}
					</Paragraph>
				)}
			</div>

			<div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto pr-1">
				{conflicts.map((conflict) => {
					const isKeepActive = conflict.resolution === "keep";
					const isUseNewActive = conflict.resolution === "use-new";
					const isBothActive = conflict.resolution === "both";
					const wordingMatches = conflict.wordingMatches ?? [];
					const matchCount = wordingMatches.length;
					const matchIndex = conflict.matchIndex ?? FIRST_MATCH_INDEX;
					const activeSpan =
						wordingMatches[matchIndex]?.span ??
						wordingMatches[FIRST_MATCH_INDEX]?.span ??
						"";
					const hasWordingMatches =
						conflict.field === "content" && matchCount > FIRST_MATCH_INDEX;
					const canKeepBoth =
						hasWordingMatches ||
						(conflict.field === "content" &&
							conflict.mergedValue !== undefined);

					return (
						<div
							className="flex shrink-0 flex-col gap-3 rounded-xl border border-border bg-surface p-3.5 tablet:p-4 shadow-sm"
							key={conflict.id}
						>
							<div className="flex items-center gap-2 border-b border-border-subtle pb-2">
								<span className="font-mono text-2xs font-bold uppercase tracking-wider text-text-muted">
									Conflict in field:
								</span>
								<span className="rounded-md border border-border bg-secondary px-2.5 py-0.5 font-mono text-xs font-semibold capitalize text-text">
									{conflict.field}
								</span>
							</div>

							<div className="grid grid-cols-1 tablet:grid-cols-2 gap-3">
								<div
									className={getValidClassNames(
										"flex flex-col justify-between rounded-xl border p-3.5 transition-all gap-3",
										isKeepActive
											? "border-accent bg-success-bg/15 shadow-xs"
											: "border-border-subtle bg-bg opacity-75 hover:opacity-100",
									)}
								>
									<div className="flex flex-col gap-1.5">
										<div className="flex items-center justify-between">
											<span className="font-mono text-2xs font-bold uppercase tracking-wider text-text-muted">
												Live Version (in KB)
												{hasWordingMatches && wordingMatches[matchIndex]?.title
													? ` · ${wordingMatches[matchIndex].title}`
													: ""}
											</span>

											{isKeepActive && (
												<span className="font-sans text-2xs font-semibold text-accent">
													✓ Selected
												</span>
											)}
										</div>
										<div className="whitespace-pre-line font-sans text-sm leading-relaxed text-text">
											{hasWordingMatches ? (
												<HighlightedSpan
													span={activeSpan}
													text={conflict.currentValue}
												/>
											) : (
												conflict.currentValue
											)}
										</div>
									</div>

									<button
										className={getValidClassNames(
											"w-full rounded-lg py-2 text-xs font-semibold transition-colors border shrink-0",
											isKeepActive
												? "border-accent bg-accent text-white"
												: "border-border bg-surface text-text-muted hover:bg-secondary hover:text-text",
										)}
										data-conflict-id={conflict.id}
										data-resolution="keep"
										disabled={isApplying}
										onClick={handleResolveConflict}
										type="button"
									>
										Keep Live Version
									</button>
								</div>

								<div
									className={getValidClassNames(
										"flex flex-col justify-between rounded-xl border p-3.5 transition-all gap-3",
										isUseNewActive
											? "border-accent bg-success-bg/15 shadow-xs"
											: "border-border-subtle bg-bg opacity-75 hover:opacity-100",
									)}
								>
									<div className="flex flex-col gap-1.5">
										<div className="flex items-center justify-between">
											<span className="font-mono text-2xs font-bold uppercase tracking-wider text-accent font-semibold">
												Incoming Version (from document)
											</span>
											{isUseNewActive && (
												<span className="font-sans text-2xs font-semibold text-accent">
													✓ Selected
												</span>
											)}
										</div>
										<div className="whitespace-pre-line font-sans text-sm leading-relaxed text-text">
											{conflict.incomingValue}
										</div>
									</div>

									<button
										className={getValidClassNames(
											"w-full rounded-lg py-2 text-xs font-semibold transition-colors border shrink-0",
											isUseNewActive
												? "border-accent bg-accent text-white"
												: "border-border bg-surface text-text-muted hover:bg-secondary hover:text-text",
										)}
										data-conflict-id={conflict.id}
										data-resolution="use-new"
										disabled={isApplying}
										onClick={handleResolveConflict}
										type="button"
									>
										Use Incoming Version
									</button>
								</div>
							</div>

							{canKeepBoth && (
								<div className="flex flex-col gap-2">
									{hasWordingMatches && matchCount > SINGLE_MATCH_COUNT && (
										<div className="flex items-center justify-between gap-2">
											<button
												className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-secondary hover:text-text"
												data-conflict-id={conflict.id}
												data-match-step="previous"
												disabled={isApplying}
												onClick={handleMatchStep}
												type="button"
											>
												Previous
											</button>
											<span className="font-mono text-2xs font-semibold uppercase tracking-wider text-text-muted">
												item {matchIndex + MATCH_LABEL_OFFSET} of {matchCount}
											</span>
											<button
												className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text-muted hover:bg-secondary hover:text-text"
												data-conflict-id={conflict.id}
												data-match-step="next"
												disabled={isApplying}
												onClick={handleMatchStep}
												type="button"
											>
												Next
											</button>
										</div>
									)}
									<button
										className={getValidClassNames(
											"w-full rounded-lg border py-2 text-xs font-semibold transition-colors",
											isBothActive
												? "border-accent bg-accent text-white"
												: "border-border bg-surface text-text-muted hover:bg-secondary hover:text-text",
										)}
										data-conflict-id={conflict.id}
										data-resolution="both"
										disabled={isApplying}
										onClick={handleResolveConflict}
										type="button"
									>
										Both{isBothActive ? " · Selected" : ""}
									</button>
									{isBothActive && (
										<div className="flex flex-col gap-1.5 rounded-xl border border-info/25 bg-info-bg/40 p-3.5">
											<span className="font-mono text-2xs font-bold uppercase tracking-wider text-info">
												After publishing
											</span>
											<div className="whitespace-pre-line font-sans text-sm leading-relaxed text-text">
												{conflict.mergedValue ??
													`${conflict.currentValue}${BOTH_SEPARATOR}${conflict.incomingValue}`}
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>

			<div className="mt-auto flex shrink-0 items-center justify-between border-t border-border-subtle pt-2.5 px-1">
				<Button disabled={isApplying} onClick={onCancel} variant="secondary">
					{cancelLabel}
				</Button>
				<Button
					disabled={!hasAllResolved || isApplying}
					onClick={handleConsolidatedPublish}
					variant="primary"
				>
					<Icon name="checkbox-tick" size={CHECK_ICON_SIZE} />
					<span>{submitLabel}</span>
				</Button>
			</div>
		</div>
	);
};

export { MergeScreen };
