import React, { useCallback } from "react";

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
		iconNode: (
			<svg
				fill="none"
				height="20"
				stroke="currentColor"
				strokeWidth="1.5"
				viewBox="0 0 24 24"
				width="20"
			>
				<rect height="18" rx="3" width="14" x="5" y="3" />
				<circle cx="12" cy="17" fill="currentColor" r="1" />
			</svg>
		),
		label: "Admin",
	},
	EDITOR: {
		badgeBg: "bg-(--color-success-bg)",
		badgeText: "text-(--color-success)",
		iconBg: "bg-(--color-success-bg)",
		iconColor: "text-(--color-success)",
		iconNode: (
			<svg
				fill="none"
				height="20"
				stroke="currentColor"
				strokeWidth="1.5"
				viewBox="0 0 24 24"
				width="20"
			>
				<path
					d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		),
		label: "Editor",
	},
	VIEWER: {
		badgeBg: "bg-(--color-warning-bg)",
		badgeText: "text-(--color-warning)",
		iconBg: "bg-(--color-warning-bg)",
		iconColor: "text-(--color-warning)",
		iconNode: (
			<svg
				fill="none"
				height="20"
				stroke="currentColor"
				strokeWidth="1.5"
				viewBox="0 0 24 24"
				width="20"
			>
				<path
					d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<circle
					cx="12"
					cy="12"
					r="3"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		),
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
							<button
								aria-label="Edit project"
								className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-(--color-secondary) hover:text-text"
								onClick={handleEdit}
								type="button"
							>
								<svg
									fill="none"
									height="14"
									stroke="currentColor"
									strokeWidth="1.5"
									viewBox="0 0 24 24"
									width="14"
								>
									<path
										d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
									<path
										d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</button>
						)}

						{onDelete && (
							<button
								aria-label="Delete project"
								className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-text-muted transition-colors hover:bg-red-50 hover:text-red-600"
								onClick={handleDelete}
								type="button"
							>
								<svg
									fill="none"
									height="14"
									stroke="currentColor"
									strokeWidth="1.5"
									viewBox="0 0 24 24"
									width="14"
								>
									<path
										d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</button>
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
					<svg
						className="h-3.5 w-3.5 shrink-0 text-text-faint"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<circle cx="12" cy="12" r="9" strokeWidth="1.5" />
						<path d="M12 7v5l3 2" strokeLinecap="round" strokeWidth="1.5" />
					</svg>
					<span>{formatRelativeTime(updatedAt)}</span>
				</div>

				<button
					aria-label="Open project"
					className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-(--color-secondary) text-text-muted transition-colors hover:border-primary hover:bg-primary hover:text-(--color-primary-fg)"
					onClick={handleClick}
					type="button"
				>
					<svg
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							d="M13.5 4.5L19.5 10.5M19.5 10.5L13.5 16.5M19.5 10.5H4.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="1.5"
						/>
					</svg>
				</button>
			</div>
		</div>
	);
};

export { ProjectCard };
