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
	CHEVRON_ICON_SIZE,
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
const TOGGLE_TOOLTIP_CLASS_NAME =
	"pointer-events-none invisible absolute top-1/2 left-full z-30 ml-2 -translate-y-1/2 rounded-md bg-primary px-2 py-1 text-xs font-medium whitespace-nowrap text-primary-fg opacity-0 shadow-md group-hover/toggle:visible group-hover/toggle:opacity-100";

const SidebarToggle = ({
	isExpanded,
	onToggle,
}: SidebarToggleProperties): React.JSX.Element => {
	const label = isExpanded ? COLLAPSE_SIDEBAR_LABEL : EXPAND_SIDEBAR_LABEL;

	return (
		<div className="group/toggle absolute top-1/2 -right-3 z-30 -translate-y-1/2">
			<button
				aria-controls={APP_SIDEBAR_ID}
				aria-expanded={isExpanded}
				aria-label={label}
				className="flex size-6 cursor-pointer items-center justify-center rounded-full border border-border bg-surface text-text-muted shadow-sm hover:text-text focus-visible:ring-3 focus-visible:ring-accent/35 focus-visible:outline-none"
				onClick={onToggle}
				type="button"
			>
				<span className={isExpanded ? "inline-flex rotate-180" : "inline-flex"}>
					<Icon name="chevron-filled-right" size={CHEVRON_ICON_SIZE} />
				</span>
			</button>
			<span
				aria-hidden="true"
				className={TOGGLE_TOOLTIP_CLASS_NAME}
				role="presentation"
			>
				{label}
			</span>
		</div>
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
		<div className="flex min-w-0 items-center gap-2.5 p-2 text-accent">
			<span className="shrink-0">
				<Icon name="project" size={PROJECT_ICON_SIZE} />
			</span>
			<div className="min-w-0 flex-1">
				<div className="truncate text-sm font-medium" title={projectName}>
					{projectName}
				</div>
				<div className="font-mono text-2xs text-text-faint">{role} ROLE</div>
			</div>
		</div>
	);
};

const BackChevron = (): React.JSX.Element => {
	return (
		<span className="inline-flex rotate-180">
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
				{isExpanded && <span>{BACK_TO_PROJECTS_LABEL}</span>}
			</Link>
		</NavTooltip>
	);
};

const SidebarHeading = ({
	isExpanded,
	projectId,
	projectName,
	role,
}: {
	isExpanded: boolean;
	projectId: string | undefined;
	projectName: string;
	role: string;
}): React.JSX.Element => {
	if (!isExpanded) {
		return (
			<div className="flex w-full justify-center">
				<BackToProjectsControl isExpanded={false} />
			</div>
		);
	}

	return (
		<div className="flex w-full flex-col items-stretch gap-1">
			<BackToProjectsControl isExpanded />
			{projectId && <ProjectHeading projectName={projectName} role={role} />}
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
		"relative flex h-full shrink-0 flex-col border-r border-border bg-surface py-5",
		isExpanded ? "w-58 gap-5 px-3.5" : "w-14",
	);

	return (
		<aside
			className={asideClassName}
			id={APP_SIDEBAR_ID}
			ref={asideRef}
			tabIndex={-1}
		>
			<SidebarToggle isExpanded={isExpanded} onToggle={onToggle} />
			<SidebarHeading
				isExpanded={isExpanded}
				projectId={projectId}
				projectName={projectName}
				role={role}
			/>
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
					"mt-auto flex w-full flex-col gap-2.5 border-t border-border-subtle pt-3.5",
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
							{isExpanded && <span>{ADD_KNOWLEDGE_LABEL}</span>}
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
