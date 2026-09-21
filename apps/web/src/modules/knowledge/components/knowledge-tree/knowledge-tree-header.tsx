import React, { useCallback } from "react";

import { Button } from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import { useNavigate } from "~/hooks/hooks.js";

import { LoadingState } from "../loading-state/loading-state.js";
import { LAST_INDEX_OFFSET } from "./constants.js";

type Properties = {
	breadcrumbs: string[];
	canEdit?: boolean;
	onOpenSidebar: () => void;
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
		<Icon aria-hidden="true" name="filter" size={16} />
	</Button>
);

const MobileCenteredTitle = ({ title }: { title: string | undefined }) => {
	if (!title) {
		return null;
	}

	return (
		<div className="absolute left-1/2 -translate-x-1/2 font-medium text-text text-control @5xl:hidden">
			{title}
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
			className="hidden items-center gap-2 text-[13px] text-text-muted @5xl:flex"
		>
			{breadcrumbs.map((breadcrumb, index) => {
				const isLast = index === breadcrumbs.length - LAST_INDEX_OFFSET;
				return (
					<React.Fragment key={`${String(index)}-${breadcrumb}`}>
						<span
							aria-current={isLast ? "page" : undefined}
							className={isLast ? "font-medium text-text" : "text-text-muted"}
						>
							{breadcrumb}
						</span>
						{!isLast && (
							<Icon aria-hidden="true" name="chevron-filled-right" size={10} />
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
	onOpenSidebar,
	showCompactLoading = false,
}: Properties) => {
	const navigate = useNavigate();
	const currentFileName = breadcrumbs.at(-LAST_INDEX_OFFSET);

	const handlePreview = useCallback(() => {
		// placeholder for preview
	}, []);

	const handleEditClick = useCallback(() => {
		void navigate("edit");
	}, [navigate]);

	return (
		<div className="relative flex items-center justify-between border-b border-border bg-surface px-4 py-4 @5xl:px-8">
			<MobileSidebarToggle onOpenSidebar={onOpenSidebar} />
			<KnowledgeTreeBreadcrumbs breadcrumbs={breadcrumbs} />
			<MobileCenteredTitle title={currentFileName} />

			<div className="flex items-center gap-3.5">
				{showCompactLoading && (
					<div className="hidden @5xl:block">
						<LoadingState onPreview={handlePreview} variant="compact" />
					</div>
				)}
				{canEdit && (
					<Button onClick={handleEditClick} variant="primary">
						Edit
					</Button>
				)}
			</div>
		</div>
	);
};

export { KnowledgeTreeHeader };
