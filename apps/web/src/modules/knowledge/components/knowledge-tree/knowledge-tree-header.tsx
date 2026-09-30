import { type DocumentStatus } from "@knowledgeprism/constants";
import React from "react";

import { Button } from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import { type ValueOf } from "~/lib/types/types.js";

import { LAST_INDEX_OFFSET } from "../../libs/constants/constants.js";
import { LoadingState } from "../loading-state/loading-state.js";

type Properties = {
	breadcrumbs: string[];
	canEdit?: boolean;
	currentStatus: "IDLE" | "UPLOADED" | ValueOf<typeof DocumentStatus>;
	hasError?: boolean;
	isEditing?: boolean;
	onCancel?: () => void;
	onEdit?: () => void;
	onOpenSidebar: () => void;
	onPreview: () => void;
	onResetState: () => void;
	onRetry: () => void;
	showCompactLoading?: boolean;
};

const MobileSidebarToggle = ({
	onOpenSidebar,
}: {
	onOpenSidebar: () => void;
}) => (
	<Button
		aria-label="Toggle sidebar"
		className="flex @5xl:hidden"
		onClick={onOpenSidebar}
		variant="icon"
	>
		<Icon aria-hidden="true" name="hamburger" size={16} />
	</Button>
);

const MobileCenteredTitle = ({ title }: { title: string | undefined }) => {
	if (!title) {
		return null;
	}

	return (
		<div className="absolute inset-y-0 left-14 right-22 flex items-center justify-center @5xl:hidden">
			<span className="block truncate px-2 font-medium text-text text-control">
				{title}
			</span>
		</div>
	);
};

const KnowledgeTreeBreadcrumbs = ({
	breadcrumbs,
}: {
	breadcrumbs: string[];
}) => {
	return (
		<nav
			aria-label="Breadcrumb"
			className="hidden min-w-0 flex-1 items-center gap-2 text-[13px] text-text-muted @5xl:flex"
		>
			{breadcrumbs.map((breadcrumb, index) => {
				const isLast = index === breadcrumbs.length - LAST_INDEX_OFFSET;
				return (
					<React.Fragment key={`${String(index)}-${breadcrumb}`}>
						<span
							aria-current={isLast ? "page" : undefined}
							className={`block truncate ${
								isLast ? "font-medium text-text" : "text-text-muted"
							}`}
							title={breadcrumb}
						>
							{breadcrumb}
						</span>
						{!isLast && (
							<span className="shrink-0">
								<Icon
									aria-hidden="true"
									name="chevron-filled-right"
									size={10}
								/>
							</span>
						)}
					</React.Fragment>
				);
			})}
		</nav>
	);
};

const KnowledgeTreeHeader: React.FC<Properties> = ({
	breadcrumbs,
	canEdit = false,
	currentStatus,
	hasError = false,
	isEditing = false,
	onCancel,
	onEdit,
	onOpenSidebar,
	onPreview,
	onResetState,
	onRetry,
	showCompactLoading = false,
}: Properties) => {
	const currentFileName = breadcrumbs.at(-LAST_INDEX_OFFSET);

	return (
		<div className="relative flex items-center justify-between gap-4 border-b border-border bg-surface px-4 py-4 @5xl:px-8">
			<div className="flex min-w-0 flex-1 items-center">
				<MobileSidebarToggle onOpenSidebar={onOpenSidebar} />
				<KnowledgeTreeBreadcrumbs breadcrumbs={breadcrumbs} />
			</div>

			<MobileCenteredTitle title={currentFileName} />

			<div className="relative z-10 flex shrink-0 items-center gap-3.5">
				{showCompactLoading && (
					<div className="hidden @5xl:block">
						{hasError || currentStatus === "FAILED" ? (
							<LoadingState
								currentStatus={currentStatus}
								hasError={true}
								onCancel={onResetState}
								onRetry={onRetry}
								variant="compact"
							/>
						) : (
							<LoadingState
								currentStatus={currentStatus}
								onPreview={onPreview}
								variant="compact"
							/>
						)}
					</div>
				)}
				{canEdit && !isEditing && (
					<Button onClick={onEdit} variant="primary">
						Edit
					</Button>
				)}
				{canEdit && isEditing && (
					<>
						<Button
							aria-label="Cancel"
							className="h-10 w-10 p-0! @5xl:h-auto @5xl:w-auto @5xl:px-5! @5xl:py-2.5!"
							onClick={onCancel}
							variant="ghost"
						>
							<span className="hidden @5xl:inline">Cancel</span>
							<span className="inline @5xl:hidden">
								<Icon aria-hidden="true" name="close" size={16} />
							</span>
						</Button>
						<Button
							aria-label="Save"
							className="h-10 w-10 p-0! @5xl:h-auto @5xl:w-auto @5xl:px-5! @5xl:py-2.5!"
							form="kb-entry-form"
							type="submit"
							variant="primary"
						>
							<span className="hidden @5xl:inline">Save</span>
							<span className="inline @5xl:hidden">
								<Icon aria-hidden="true" name="checkbox-tick" size={16} />
							</span>
						</Button>
					</>
				)}
			</div>
		</div>
	);
};

export { KnowledgeTreeHeader };
