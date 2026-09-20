import React, { useCallback, useMemo } from "react";

import { Heading, Icon } from "~/components/components.js";

import { type RecentDocumentItem } from "../types/types.js";

type DocumentRowProperties = {
	document: RecentDocumentItem;
	onSelect?: ((document: RecentDocumentItem) => void) | undefined;
};

type Properties = {
	documents: RecentDocumentItem[];
	isLoading?: boolean;
	onSelectDocument?: ((document: RecentDocumentItem) => void) | undefined;
};

const EMPTY_LENGTH = 0;
const START_INDEX = 0;
const MAX_DOCUMENTS_COUNT = 5;

const MILLISECONDS_IN_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

const formatRelativeTime = (isoDate: string): string => {
	const diffInSeconds = Math.floor(
		(Date.now() - new Date(isoDate).getTime()) / MILLISECONDS_IN_SECOND,
	);

	if (Number.isNaN(diffInSeconds) || diffInSeconds < SECONDS_IN_MINUTE) {
		return "Just now";
	}

	const diffInMinutes = Math.floor(diffInSeconds / SECONDS_IN_MINUTE);
	if (diffInMinutes < MINUTES_IN_HOUR) {
		return `${String(diffInMinutes)}m ago`;
	}

	const diffInHours = Math.floor(diffInMinutes / MINUTES_IN_HOUR);
	if (diffInHours < HOURS_IN_DAY) {
		return `${String(diffInHours)}h ago`;
	}

	const diffInDays = Math.floor(diffInHours / HOURS_IN_DAY);

	return `${String(diffInDays)}d ago`;
};

const DocumentRow: React.FC<DocumentRowProperties> = ({
	document,
	onSelect,
}) => {
	const handleClick = useCallback((): void => {
		onSelect?.(document);
	}, [document, onSelect]);

	return (
		<button
			className="group flex w-full cursor-pointer items-center justify-between px-4 py-3 text-left transition-colors hover:bg-secondary/40 focus:outline-none sm:px-5 sm:py-3.5"
			onClick={handleClick}
			type="button"
		>
			<div className="flex min-w-0 items-center gap-3">
				<span className="text-text-muted transition-colors group-hover:text-text">
					<Icon name="file" size={16} />
				</span>
				<span className="truncate text-sm font-normal text-text">
					{document.title}
				</span>
			</div>

			<span className="shrink-0 pl-4 font-mono text-xs text-text-muted">
				{formatRelativeTime(document.updatedAt)}
			</span>
		</button>
	);
};

const RecentDocuments: React.FC<Properties> = ({
	documents,
	isLoading = false,
	onSelectDocument,
}) => {
	const visibleDocuments = useMemo(() => {
		return documents.slice(START_INDEX, MAX_DOCUMENTS_COUNT);
	}, [documents]);

	if (isLoading) {
		return (
			<section className="mt-12">
				<Heading className="mb-3.5 font-normal" level="3">
					Recent Documents
				</Heading>
				<div className="overflow-hidden rounded-xl border border-border bg-surface p-4">
					<div className="space-y-3">
						<div className="h-5 w-full animate-pulse rounded bg-secondary" />
						<div className="h-5 w-full animate-pulse rounded bg-secondary" />
						<div className="h-5 w-full animate-pulse rounded bg-secondary" />
					</div>
				</div>
			</section>
		);
	}

	if (visibleDocuments.length === EMPTY_LENGTH) {
		return null;
	}

	return (
		<section className="mt-12">
			<Heading className="mb-3.5 font-normal" level="3">
				Recent Documents
			</Heading>

			<div className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
				{visibleDocuments.map((document) => (
					<DocumentRow
						document={document}
						key={document.id}
						{...(onSelectDocument ? { onSelect: onSelectDocument } : {})}
					/>
				))}
			</div>
		</section>
	);
};

export { RecentDocuments };
