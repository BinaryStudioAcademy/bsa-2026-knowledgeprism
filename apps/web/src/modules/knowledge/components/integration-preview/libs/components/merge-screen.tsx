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
	type ProposedPage,
	type ProposedSection,
} from "~/modules/knowledge/libs/types/types.js";

const CHECK_ICON_SIZE = 14;
const VALID_RESOLUTIONS: readonly ConflictResolution[] = [
	"keep",
	"use-new",
] as const;

type MergeScreenProperties = {
	conflicts: FieldConflict[];
	onCancel: () => void;
	onPublish: (resolvedPages: ProposedPage[]) => void;
	pages: ProposedPage[];
};

const resolveSectionField = (
	conflict: FieldConflict,
	resolutionMap: Map<string, ConflictResolution>,
): string => {
	const choice = resolutionMap.get(conflict.id) ?? "use-new";

	return choice === "keep" ? conflict.currentValue : conflict.incomingValue;
};

const resolveSection = (
	section: ProposedSection,
	conflicts: FieldConflict[],
	resolutionMap: Map<string, ConflictResolution>,
): ProposedSection => {
	const titleConflict = conflicts.find(
		(conflict) =>
			conflict.field === "title" &&
			(conflict.id === `conf-title-${section.id}` ||
				conflict.id === `conf-default-title-${section.id}`),
	);

	const contentConflict = conflicts.find(
		(conflict) =>
			conflict.field === "content" &&
			(conflict.id === `conf-content-${section.id}` ||
				conflict.id === `conf-default-content-${section.id}`),
	);

	const resolvedTitle = titleConflict
		? resolveSectionField(titleConflict, resolutionMap)
		: section.title;

	const resolvedContent = contentConflict
		? resolveSectionField(contentConflict, resolutionMap)
		: section.content;

	return {
		...section,
		content: resolvedContent,
		status: titleConflict || contentConflict ? "UPDATE" : section.status,
		title: resolvedTitle,
	};
};

const MergeScreen = ({
	conflicts: initialConflicts,
	onCancel,
	onPublish,
	pages,
}: MergeScreenProperties): JSX.Element => {
	const [conflicts, setConflicts] = useState<FieldConflict[]>(() =>
		initialConflicts.map((conflict) => ({
			...conflict,
			resolution: conflict.resolution ?? "use-new",
		})),
	);

	const handleResolveConflict = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const target = event.currentTarget;
			const conflictId = target.dataset["conflictId"];
			const rawResolution = target.dataset["resolution"] as ConflictResolution;
			const resolution = VALID_RESOLUTIONS.includes(rawResolution)
				? rawResolution
				: undefined;

			if (conflictId && resolution) {
				setConflicts((previousConflicts) =>
					previousConflicts.map((item) =>
						item.id === conflictId ? { ...item, resolution } : item,
					),
				);
			}
		},
		[],
	);

	const handleConsolidatedPublish = useCallback((): void => {
		const resolutionMap = new Map<string, ConflictResolution>();
		for (const item of conflicts) {
			if (item.resolution) {
				resolutionMap.set(item.id, item.resolution);
			}
		}

		const resolvedPages = pages.map((page) => ({
			...page,
			sections: page.sections.map((section) =>
				resolveSection(section, conflicts, resolutionMap),
			),
		}));

		onPublish(resolvedPages);
	}, [conflicts, onPublish, pages]);

	const hasAllResolved = conflicts.every((item) => Boolean(item.resolution));

	return (
		<div className="mx-auto flex h-full max-h-full w-full max-w-5xl flex-col justify-between gap-3 p-3 tablet:p-5 pb-2 tablet:pb-4 font-sans text-text overflow-hidden">
			<div className="flex shrink-0 flex-col gap-1.5 border-b border-border-subtle pb-2.5">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
					<Heading
						className="font-serif text-lg tablet:text-2xl font-bold tracking-tight text-text leading-tight"
						level="2"
					>
						Conflict Resolution
					</Heading>
					<span className="inline-flex self-start sm:self-auto shrink-0 items-center justify-center rounded-full border border-warning/40 bg-warning-bg px-2.5 py-0.5 font-mono text-2xs font-semibold uppercase tracking-wider text-warning whitespace-nowrap">
						Concurrent changes detected
					</span>
				</div>
				<Paragraph
					className="text-text-muted font-sans text-xs tablet:text-sm"
					size={ParagraphSize.BODY_SMALL}
				>
					Review differences below and choose which version to apply for each
					field.
				</Paragraph>
			</div>

			<div className="flex flex-1 min-h-0 flex-col gap-4 overflow-y-auto pr-1">
				{conflicts.map((conflict) => {
					const isKeepActive = conflict.resolution === "keep";
					const isUseNewActive = conflict.resolution === "use-new";

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
											</span>
											{isKeepActive && (
												<span className="font-sans text-2xs font-semibold text-accent">
													✓ Selected
												</span>
											)}
										</div>
										<div className="font-sans text-sm leading-relaxed text-text">
											{conflict.currentValue}
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
										onClick={handleResolveConflict}
										type="button"
									>
										Use Incoming Version
									</button>
								</div>
							</div>
						</div>
					);
				})}
			</div>

			<div className="mt-auto flex shrink-0 items-center justify-between border-t border-border-subtle pt-2.5 px-1">
				<Button onClick={onCancel} variant="secondary">
					Cancel
				</Button>
				<Button
					disabled={!hasAllResolved}
					onClick={handleConsolidatedPublish}
					variant="primary"
				>
					<Icon name="checkbox-tick" size={CHECK_ICON_SIZE} />
					<span>Publish resolution</span>
				</Button>
			</div>
		</div>
	);
};

export { MergeScreen };
