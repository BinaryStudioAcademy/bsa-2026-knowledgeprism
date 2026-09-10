import React, { useCallback } from "react";

import { Button, Icon } from "~/components/components.js";

import { type ProjectRole } from "../types/types.js";

interface ProjectCardProperties {
	description?: string;
	id: string;
	name: string;
	onDelete?: () => void;
	onEdit?: () => void;
	onSelect?: (id: string) => void;
	role: ProjectRole;
	updatedAt: string;
}

const DAYS_PER_WEEK = 7;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SINGLE_UNIT = 1;

const roleConfig: Record<
	ProjectRole,
	{
		badgeBg: string;
		badgeText: string;
		iconBg: string;
		iconColor: string;
		iconNode: React.ReactNode;
		label: string;
	}
> = {
	ADMIN: {
		badgeBg: "bg-(--color-success-bg)",
		badgeText: "text-(--color-success)",
		iconBg: "bg-(--color-success-bg)",
		iconColor: "text-(--color-success)",
		iconNode: <Icon name="shield" size={20} />,
		label: "Admin",
	},
	EDITOR: {
		badgeBg: "bg-(--color-success-bg)",
		badgeText: "text-(--color-success)",
		iconBg: "bg-(--color-success-bg)",
		iconColor: "text-(--color-success)",
		iconNode: <Icon name="file" size={20} />,
		label: "Editor",
	},
	VIEWER: {
		badgeBg: "bg-(--color-warning-bg)",
		badgeText: "text-(--color-warning)",
		iconBg: "bg-(--color-warning-bg)",
		iconColor: "text-(--color-warning)",
		iconNode: <Icon name="search" size={20} />,
		label: "Viewer",
	},
};

const formatRelativeTime = (dateString: string): string => {
	if (!dateString) {
		return "";
	}

	const date = new Date(dateString);

	if (Number.isNaN(date.getTime())) {
		return dateString;
	}

	const now = new Date();
	const diffHours = Math.floor(
		(now.getTime() - date.getTime()) /
			(MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR),
	);

	if (diffHours < HOURS_PER_DAY) {
		const hours = Math.max(SINGLE_UNIT, diffHours);
		return `Updated ${String(hours)} ${hours === SINGLE_UNIT ? "hour" : "hours"} ago`;
	}

	const diffDays = Math.floor(diffHours / HOURS_PER_DAY);

	if (diffDays < DAYS_PER_WEEK) {
		return `Updated ${String(diffDays)} ${diffDays === SINGLE_UNIT ? "day" : "days"} ago`;
	}

	const diffWeeks = Math.floor(diffDays / DAYS_PER_WEEK);

	return `Updated ${String(diffWeeks)} ${diffWeeks === SINGLE_UNIT ? "week" : "weeks"} ago`;
};

const ProjectCard: React.FC<ProjectCardProperties> = ({
	description = "",
	id,
	name,
	onDelete,
	onEdit,
	onSelect,
	role,
	updatedAt,
}) => {
	const handleClick = useCallback(() => {
		onSelect?.(id);
	}, [id, onSelect]);

	const handleDelete = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			event.stopPropagation();
			onDelete?.();
		},
		[onDelete],
	);

	const handleEdit = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			event.stopPropagation();
			onEdit?.();
		},
		[onEdit],
	);

	const handleKeyDown = useCallback(
		(event_: React.KeyboardEvent) => {
			if (event_.key !== "Enter" && event_.key !== " ") {
				return;
			}

			event_.preventDefault();
			onSelect?.(id);
		},
		[id, onSelect],
	);

	const currentRoleConfig = roleConfig[role];

	return (
		<div
			className="group relative flex w-full cursor-pointer flex-col justify-between rounded-lg border border-border bg-(--color-surface) p-5 text-left shadow-(--shadow-sm) transition-all hover:border-(--color-control-inactive) hover:shadow-(--shadow-md)"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
		>
			<div>
				<div className="mb-4 flex items-center justify-between gap-2">
					<div
						className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md ${currentRoleConfig.iconBg} ${currentRoleConfig.iconColor}`}
					>
						{currentRoleConfig.iconNode}
					</div>

					<div className="flex items-center gap-2">
						<span
							className={`rounded-full px-3 py-1 text-(length:--text-xs) font-medium ${currentRoleConfig.badgeBg} ${currentRoleConfig.badgeText}`}
						>
							{currentRoleConfig.label}
						</span>

						{onEdit && (
							<Button
								aria-label="Edit project"
								className="h-8 w-8 text-text-muted hover:bg-(--color-secondary) hover:text-text"
								onClick={handleEdit}
								variant="icon"
							>
								<Icon name="file-sharp" size={14} />
							</Button>
						)}

						{onDelete && (
							<Button
								aria-label="Delete project"
								className="h-8 w-8 text-text-muted hover:bg-red-50 hover:text-red-600"
								onClick={handleDelete}
								variant="icon"
							>
								<Icon name="close" size={14} />
							</Button>
						)}
					</div>
				</div>

				<h3 className="mb-1 font-serif text-h4 font-normal text-text wrap-break-words">
					{name}
				</h3>

				{description && (
					<p className="line-clamp-2 text-control leading-relaxed text-text-muted wrap-break-words">
						{description}
					</p>
				)}
			</div>

			<div className="mt-5 flex items-center justify-between border-t border-(--color-border-subtle) pt-4">
				<div className="flex items-center gap-1.5 text-(length:--text-sm) text-text-muted">
					<Icon name="aperture" size={14} />
					<span>{formatRelativeTime(updatedAt)}</span>
				</div>

				<Button
					aria-label="Open project"
					className="h-8 w-8 rounded-full border border-border bg-(--color-secondary) text-text-muted transition-colors hover:border-primary hover:bg-primary hover:text-(--color-primary-fg)"
					onClick={handleClick}
					variant="icon"
				>
					<Icon name="arrow-right-long" size={16} />
				</Button>
			</div>
		</div>
	);
};

export { ProjectCard };
