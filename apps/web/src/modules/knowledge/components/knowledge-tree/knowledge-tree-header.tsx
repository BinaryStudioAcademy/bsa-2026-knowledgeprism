import React, { useCallback } from "react";

import { Button } from "~/components/components.js";
import { Icon } from "~/components/icon/icon.js";
import { useNavigate } from "~/hooks/hooks.js";

type BreadcrumbsProperties = {
	breadcrumbs: string[];
};

type Properties = {
	breadcrumbs: string[];
	canEdit?: boolean;
	onOpenSidebar: () => void;
};

const KnowledgeTreeBreadcrumbs: React.FC<BreadcrumbsProperties> = ({
	breadcrumbs,
}: BreadcrumbsProperties) => {
	const INDEX_OFFSET = 1;

	return (
		<div className="hidden items-center gap-2 text-[13px] text-text-muted @5xl:flex">
			{breadcrumbs.map((breadcrumb, index) => {
				const isLast = index === breadcrumbs.length - INDEX_OFFSET;
				return (
					<React.Fragment key={index}>
						<span
							className={isLast ? "font-medium text-text" : "text-text-muted"}
						>
							{breadcrumb}
						</span>
						{!isLast && <Icon name="chevron-filled-right" size={10} />}
					</React.Fragment>
				);
			})}
		</div>
	);
};

const KnowledgeTreeHeader: React.FC<Properties> = ({
	breadcrumbs,
	canEdit = false,
	onOpenSidebar,
}: Properties) => {
	const navigate = useNavigate();
	const INDEX_OFFSET = 1;
	const currentFileName = breadcrumbs[breadcrumbs.length - INDEX_OFFSET];

	const handleEditClick = useCallback(() => {
		void navigate("edit");
	}, [navigate]);

	return (
		<div className="relative flex items-center justify-between border-b border-border bg-surface px-4 py-4 @5xl:px-8">
			{/* Mobile/Tablet: Left Button */}
			<Button
				className="flex @5xl:hidden"
				onClick={onOpenSidebar}
				variant="icon"
			>
				<Icon name="filter" size={16} />
			</Button>

			{/* Desktop: Breadcrumbs */}
			<KnowledgeTreeBreadcrumbs breadcrumbs={breadcrumbs} />

			{/* Mobile/Tablet: Centered Title */}
			<div className="absolute left-1/2 -translate-x-1/2 font-medium text-text text-control @5xl:hidden">
				{currentFileName}
			</div>

			<div className="flex items-center gap-3.5">
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
