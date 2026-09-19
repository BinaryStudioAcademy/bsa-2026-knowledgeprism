import React from "react";
import { Link } from "react-router-dom";

import { Icon } from "~/components/icon/icon.js";

type BreadcrumbsProperties = {
	breadcrumbs: string[];
};

type Properties = {
	breadcrumbs: string[];
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
	onOpenSidebar,
}: Properties) => {
	const INDEX_OFFSET = 1;
	const currentFileName = breadcrumbs[breadcrumbs.length - INDEX_OFFSET];

	return (
		<div className="relative flex items-center justify-between border-b border-border bg-surface px-4 py-4 @5xl:px-8">
			{/* Mobile/Tablet: Left Button */}
			<button
				className="flex items-center justify-center p-2 text-text-muted transition-colors hover:text-text @5xl:hidden"
				onClick={onOpenSidebar}
				type="button"
			>
				<Icon name="filter" size={16} />
			</button>

			{/* Desktop: Breadcrumbs */}
			<KnowledgeTreeBreadcrumbs breadcrumbs={breadcrumbs} />

			{/* Mobile/Tablet: Centered Title */}
			<div className="absolute left-1/2 -translate-x-1/2 text-control font-medium text-text @5xl:hidden">
				{currentFileName}
			</div>

			<div className="flex items-center gap-3.5">
				<Link
					className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 font-sans text-[13px] font-medium text-primary-fg transition-colors hover:bg-primary-hover"
					to="edit"
				>
					Edit
				</Link>
			</div>
		</div>
	);
};

export { KnowledgeTreeHeader };
