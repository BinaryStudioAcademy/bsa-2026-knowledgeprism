import { type Ref } from "react";
import { Link } from "react-router-dom";

import { Button } from "~/components/button/button.js";
import { Icon } from "~/components/icon/icon.js";
import { AppRoute } from "~/lib/enums/enums.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

import {
	ADD_KNOWLEDGE_ICON_SIZE,
	ADD_KNOWLEDGE_LABEL,
	APP_SIDEBAR_ID,
	BACK_CONTROL_ICON_SIZE,
	BACK_TO_PROJECTS_LABEL,
	COLLAPSE_SIDEBAR_LABEL,
	EXPAND_SIDEBAR_LABEL,
	PROJECT_ICON_SIZE,
	RAIL_NAV_ITEM_CLASS,
} from "./libs/constants.js";
import { type NavItem, NavRow, NavTooltip } from "./sidebar-nav-item.js";

type SidebarPanelProperties = {
	asideRef?: Ref<HTMLElement>;
	canAddKnowledge: boolean;
	isAddingKnowledge: boolean;
	isExpanded: boolean;
	onAddKnowledgeClick: () => void;
	onToggle: () => void;
	primaryNavItems: NavItem[];
	projectId: string | undefined;
	projectName: string;
	role: string;
	utilityNavItems: NavItem[];
};

type SidebarToggleProperties = {
	isExpanded: boolean;
	onToggle: () => void;
};

const EMPTY_LENGTH = 0;

const SidebarToggle = ({
	isExpanded,
	onToggle,
}: SidebarToggleProperties): React.JSX.Element => {
	const label = isExpanded ? COLLAPSE_SIDEBAR_LABEL : EXPAND_SIDEBAR_LABEL;
	const className = getValidClassNames(
		"inline-flex items-center rounded-md font-medium text-text-faint transition-colors hover:bg-secondary hover:text-text focus-visible:ring-3 focus-visible:ring-accent/35 focus-visible:outline-none",
		RAIL_NAV_ITEM_CLASS,
	);

	return (
		<NavTooltip
			className="relative flex shrink-0"
			isEnabled={true}
			label={label}
		>
			<button
				aria-controls={APP_SIDEBAR_ID}
				aria-expanded={isExpanded}
				aria-label={label}
				className={className}
				onClick={onToggle}
				type="button"
			>
				<span className="inline-flex">
					<Icon name="hamburger" size={BACK_CONTROL_ICON_SIZE} />
				</span>
			</button>
		</NavTooltip>
	);
};

const ProjectHeading = ({
	projectName,
	role,
}: {
	projectName: string;
	role: string;
}): React.JSX.Element => {
	return (
		<div className="flex min-w-0 flex-1 items-center gap-2.5 p-2 text-accent">
			<span className="shrink-0">
				<Icon name="project" size={PROJECT_ICON_SIZE} />
			</span>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium" title={projectName}>
					{projectName}
				</div>
				<div className="font-mono text-2xs text-text-faint whitespace-nowrap">
					{role} ROLE
				</div>
			</div>
		</div>
	);
};

const BackChevron = (): React.JSX.Element => {
	return (
		<span className="flex items-center justify-center rotate-180">
			<Icon name="chevron-filled-right" size={BACK_CONTROL_ICON_SIZE} />
		</span>
	);
};

const BackToProjectsControl = ({
	isExpanded,
}: {
	isExpanded: boolean;
}): React.JSX.Element => {
	const className = getValidClassNames(
		"inline-flex items-center rounded-md font-medium text-text-faint transition-colors hover:bg-secondary hover:text-text focus-visible:ring-3 focus-visible:ring-accent/35 focus-visible:outline-none",
		isExpanded ? "w-fit gap-1.5 px-2.5 py-1.5 text-xs" : RAIL_NAV_ITEM_CLASS,
	);

	return (
		<NavTooltip isEnabled={!isExpanded} label={BACK_TO_PROJECTS_LABEL}>
			<Link
				aria-label={isExpanded ? undefined : BACK_TO_PROJECTS_LABEL}
				className={className}
				to={AppRoute.WORKSPACES}
			>
				<BackChevron />
				{isExpanded && (
					<span className="whitespace-nowrap">{BACK_TO_PROJECTS_LABEL}</span>
				)}
			</Link>
		</NavTooltip>
	);
};

const SidebarHeading = ({
	isExpanded,
	onToggle,
	projectId,
	projectName,
	role,
}: {
	isExpanded: boolean;
	onToggle: () => void;
	projectId: string | undefined;
	projectName: string;
	role: string;
}): React.JSX.Element => {
	if (!isExpanded) {
		return (
			<div className="flex w-full flex-col items-center gap-1">
				<SidebarToggle isExpanded={false} onToggle={onToggle} />
			</div>
		);
	}

	return (
		<div className="flex w-full flex-row items-center justify-between gap-1">
			{projectId ? (
				<ProjectHeading projectName={projectName} role={role} />
			) : (
				<div />
			)}
			<SidebarToggle isExpanded onToggle={onToggle} />
		</div>
	);
};

const SidebarPanel = ({
	asideRef,
	canAddKnowledge,
	isAddingKnowledge,
	isExpanded,
	onAddKnowledgeClick,
	onToggle,
	primaryNavItems,
	projectId,
	projectName,
	role,
	utilityNavItems,
}: SidebarPanelProperties): React.JSX.Element => {
	const asideClassName = getValidClassNames(
		"relative flex h-full shrink-0 flex-col border-r border-border bg-surface py-5 transition-all duration-300 ease-in-out overflow-x-hidden",
		isExpanded ? "w-[232px] gap-5 px-3.5" : "w-14 gap-5",
	);

	return (
		<aside
			className={asideClassName}
			id={APP_SIDEBAR_ID}
			ref={asideRef}
			tabIndex={-1}
		>
			<SidebarHeading
				isExpanded={isExpanded}
				onToggle={onToggle}
				projectId={projectId}
				projectName={projectName}
				role={role}
			/>
			<div
				className={getValidClassNames(
					"flex w-full -my-2",
					isExpanded ? "justify-start" : "justify-center",
				)}
			>
				<BackToProjectsControl isExpanded={isExpanded} />
			</div>
			{primaryNavItems.length > EMPTY_LENGTH && (
				<nav
					className={getValidClassNames(
						"flex w-full flex-col gap-0.5",
						isExpanded ? "items-stretch" : "items-center",
					)}
				>
					{primaryNavItems.map((item) => (
						<NavRow isExpanded={isExpanded} key={item.id} {...item} />
					))}
				</nav>
			)}
			<div
				className={getValidClassNames(
					"mt-auto flex w-full flex-col gap-2.5",
					isExpanded ? "items-stretch" : "items-center",
				)}
			>
				{canAddKnowledge && (
					<NavTooltip isEnabled={!isExpanded} label={ADD_KNOWLEDGE_LABEL}>
						<Button
							aria-label={isExpanded ? undefined : ADD_KNOWLEDGE_LABEL}
							className={getValidClassNames(
								"inline-flex items-center gap-2",
								isExpanded
									? "h-auto w-full justify-center px-3 py-2.5"
									: RAIL_NAV_ITEM_CLASS,
							)}
							disabled={isAddingKnowledge}
							onClick={onAddKnowledgeClick}
							variant="accent"
						>
							<Icon name="plus" size={ADD_KNOWLEDGE_ICON_SIZE} />
							{isExpanded && (
								<span className="whitespace-nowrap">{ADD_KNOWLEDGE_LABEL}</span>
							)}
						</Button>
					</NavTooltip>
				)}
				<div
					className={getValidClassNames(
						"flex w-full flex-col gap-0.5",
						isExpanded ? "items-stretch" : "items-center",
					)}
				>
					{utilityNavItems.map((item) => (
						<NavRow isExpanded={isExpanded} key={item.id} {...item} />
					))}
				</div>
			</div>
		</aside>
	);
};

export { SidebarPanel };
