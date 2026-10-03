import { DocumentStatus } from "@knowledgeprism/constants";
import {
	type JSX,
	type MouseEvent,
	useCallback,
	useMemo,
	useState,
} from "react";

import { Icon } from "~/components/components.js";
import {
	useAppDispatch,
	useAppSelector,
	useCurrentProjectId,
} from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import { ProcessingProgress } from "./libs/components/processing-progress.js";

const SINGLE_DOCUMENT_COUNT = 1;

type Properties = {
	activeDocumentId?: null | number;
	isReviewMutationPending?: boolean;
	onSwitchDocument?: (documentId: number) => void;
};

const PLACEMENT_REVIEW_STATUSES = new Set<string>([
	DocumentStatus.WAITING_FOR_APPROVAL,
]);

const DocumentProcessingList = ({
	activeDocumentId = null,
	isReviewMutationPending = false,
	onSwitchDocument,
}: Properties): JSX.Element | null => {
	const { documentStatuses, trackedDocuments } = useAppSelector(
		(state) => state.knowledge,
	);
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const [isExpanded, setIsExpanded] = useState(false);

	const handleToggle = useCallback(() => {
		setIsExpanded((previous) => !previous);
	}, []);

	const handlePendingReviewClick = useCallback(
		(event: MouseEvent<HTMLElement>): void => {
			if (isReviewMutationPending || !onSwitchDocument) {
				return;
			}
			const documentId = Number(event.currentTarget.dataset["documentId"]);
			if (Number.isFinite(documentId)) {
				onSwitchDocument(documentId);
			}
		},
		[isReviewMutationPending, onSwitchDocument],
	);

	const { failedDocuments, pendingReviewDocuments, processingDocuments } =
		useMemo(() => {
			const pending: typeof trackedDocuments = [];
			const failed: typeof trackedDocuments = [];
			const processing: typeof trackedDocuments = [];

			for (const document of trackedDocuments) {
				if (
					document.documentId !== activeDocumentId &&
					PLACEMENT_REVIEW_STATUSES.has(document.status)
				) {
					pending.push(document);
				} else if (document.status === DocumentStatus.FAILED) {
					failed.push(document);
				} else {
					processing.push(document);
				}
			}

			return {
				failedDocuments: failed,
				pendingReviewDocuments: pending,
				processingDocuments: processing,
			};
		}, [activeDocumentId, trackedDocuments]);

	const handleClearAllFailedDocuments = useCallback((): void => {
		if (!projectId) {
			return;
		}
		for (const document of failedDocuments) {
			void dispatch(
				actions.cancelDocument({
					documentId: document.documentId,
					projectId,
				}),
			);
		}
	}, [dispatch, failedDocuments, projectId]);

	if (trackedDocuments.length <= SINGLE_DOCUMENT_COUNT) {
		return null;
	}

	return (
		<div className="relative flex w-full shrink-0 flex-col border-b border-border bg-surface">
			<button
				className="flex w-full cursor-pointer items-center justify-between bg-surface p-4 text-sm font-medium transition-colors hover:bg-secondary/50"
				onClick={handleToggle}
				type="button"
			>
				<div className="flex flex-1 flex-wrap items-center justify-between gap-x-4 gap-y-2 pr-4">
					<span className="font-semibold">
						{trackedDocuments.length}{" "}
						{trackedDocuments.length === SINGLE_DOCUMENT_COUNT
							? "source"
							: "sources"}
					</span>
					<div className="flex flex-wrap items-center gap-2 text-xs">
						{pendingReviewDocuments.length > EMPTY_LENGTH && (
							<>
								<span className="font-medium text-text">
									{pendingReviewDocuments.length} ready
								</span>
								{(processingDocuments.length > EMPTY_LENGTH ||
									failedDocuments.length > EMPTY_LENGTH) && (
									<span className="text-border">•</span>
								)}
							</>
						)}
						{processingDocuments.length > EMPTY_LENGTH && (
							<>
								<span className="text-text-muted">
									{processingDocuments.length} processing
								</span>
								{failedDocuments.length > EMPTY_LENGTH && (
									<span className="text-border">•</span>
								)}
							</>
						)}
						{failedDocuments.length > EMPTY_LENGTH && (
							<span className="font-medium text-error">
								{failedDocuments.length} failed
							</span>
						)}
					</div>
				</div>
				<span
					className={getValidClassNames(
						"transition-transform duration-200",
						isExpanded && "rotate-180",
					)}
				>
					<Icon name="chevron-down" />
				</span>
			</button>
			{isExpanded && (
				<div
					aria-label="Document processing progress"
					className="absolute left-0 tablet:left-auto tablet:right-0 top-full z-10 flex w-full tablet:w-96 flex-col max-h-[50vh] rounded-b-md tablet:rounded-md border border-border bg-surface p-4 shadow-2xl"
				>
					<div className="flex flex-col gap-4 overflow-y-auto pr-2">
						{pendingReviewDocuments.length > EMPTY_LENGTH && (
							<ul className="flex flex-col gap-2">
								<h3 className="text-xs font-semibold uppercase text-text-muted">
									Waiting for review
								</h3>
								{pendingReviewDocuments.map((document) => (
									<li key={document.documentId}>
										<button
											className="flex w-full cursor-pointer flex-col gap-2 rounded-md border border-border bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-50"
											data-document-id={document.documentId}
											disabled={isReviewMutationPending}
											onClick={handlePendingReviewClick}
											type="button"
										>
											<p className="truncate font-medium">{document.label}</p>
										</button>
									</li>
								))}
							</ul>
						)}

						{processingDocuments.length > EMPTY_LENGTH && (
							<ul className="flex flex-col gap-2">
								<h3 className="text-xs font-semibold uppercase text-text-muted">
									Processing
								</h3>
								{processingDocuments.map((document) => (
									<li
										className="rounded-md border border-border p-3"
										key={document.documentId}
									>
										<p className="mb-1 truncate font-medium">
											{document.label}
										</p>
										<ProcessingProgress
											currentStatus={document.status}
											progress={
												documentStatuses[document.documentId]
													?.processingProgress ?? null
											}
										/>
									</li>
								))}
							</ul>
						)}

						{failedDocuments.length > EMPTY_LENGTH && (
							<ul className="flex flex-col gap-2">
								<div className="flex items-center justify-between">
									<h3 className="text-xs font-semibold uppercase text-error">
										Failed
									</h3>
									<button
										className="cursor-pointer text-xs font-medium text-text-muted transition-colors hover:text-text"
										onClick={handleClearAllFailedDocuments}
										type="button"
									>
										Clear all
									</button>
								</div>
								{failedDocuments.map((document) => (
									<li
										className="rounded-md border border-error/50 bg-error/5 p-3"
										key={document.documentId}
									>
										<p className="mb-1 truncate font-medium text-error">
											{document.label}
										</p>
										<ProcessingProgress
											currentStatus={document.status}
											progress={
												documentStatuses[document.documentId]
													?.processingProgress ?? null
											}
										/>
									</li>
								))}
							</ul>
						)}
					</div>
				</div>
			)}
		</div>
	);
};
export { DocumentProcessingList };
