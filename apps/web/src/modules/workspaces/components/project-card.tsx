import React, { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "~/components/components.js";

import { type ProjectRole } from "../types/types.js";

interface ProjectCardProperties {
	description?: string;
	id: string;
	name: string;
	onDelete?: () => void;
	onEdit?: () => void;
	onManageMembers?: () => void;
	onSelect?: (id: string) => void;
	role: ProjectRole;
	updatedAt: string;
}

const DAYS_PER_WEEK = 7;
const DAYS_PER_YEAR = 365;
const HOURS_PER_DAY = 24;
const MINUTES_PER_HOUR = 60;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const SINGLE_UNIT = 1;

const MANAGE_PROJECT_MEMBERS_LABEL = "Manage project members";
const MORE_ACTIONS_LABEL = "More actions";
const NAVIGATION_ARROW_SIZE = 16;

const FIRST_ARRAY_INDEX = 0;
const SECOND_ARRAY_INDEX = 1;
const INITIALS_SLICE_COUNT = 2;
const BITSHIFT_OFFSET = 5;
const INITIAL_HASH_VALUE = 0;
const INDEX_INCREMENT = 1;

const MIXED_CASE_REGEX = /^([a-z])([A-Z])/;

const AVATAR_COLORS = [
	{ bg: "bg-(--color-info-bg)", text: "text-(--color-info)" },
	{ bg: "bg-(--color-success-bg)", text: "text-(--color-success)" },
	{ bg: "bg-(--color-warning-bg)", text: "text-(--color-warning)" },
	{ bg: "bg-(--color-error-bg)", text: "text-(--color-error)" },
	{ bg: "bg-(--color-secondary)", text: "text-(--color-primary)" },
] as const;

const DEFAULT_AVATAR_COLOR = AVATAR_COLORS[FIRST_ARRAY_INDEX];

const getInitials = (name: string): string => {
	const trimmed = name.trim();
	if (!trimmed) {
		return "";
	}

	const words = trimmed.split(/\s+/).filter(Boolean);
	const firstWord = words[FIRST_ARRAY_INDEX] ?? "";

	if (words.length === SINGLE_UNIT) {
		const mixedCaseMatch = MIXED_CASE_REGEX.exec(firstWord);
		if (mixedCaseMatch) {
			const [, firstLetter, secondLetter] = mixedCaseMatch;
			return `${firstLetter ?? ""}${secondLetter ?? ""}`.toUpperCase();
		}

		return firstWord
			.slice(FIRST_ARRAY_INDEX, INITIALS_SLICE_COUNT)
			.toUpperCase();
	}

	const secondWord = words[SECOND_ARRAY_INDEX] ?? "";
	const firstLetter = firstWord[FIRST_ARRAY_INDEX] ?? "";
	const secondLetter = secondWord[FIRST_ARRAY_INDEX] ?? "";

	return `${firstLetter}${secondLetter}`.toUpperCase();
};

const getAvatarColor = (id: string) => {
	let hash = INITIAL_HASH_VALUE;
	for (
		let index_ = FIRST_ARRAY_INDEX;
		index_ < id.length;
		index_ += INDEX_INCREMENT
	) {
		hash =
			(id.codePointAt(index_) ?? FIRST_ARRAY_INDEX) +
			((hash << BITSHIFT_OFFSET) - hash);
	}
	const index = Math.abs(hash) % AVATAR_COLORS.length;
	return AVATAR_COLORS[index] ?? DEFAULT_AVATAR_COLOR;
};

const roleConfig: Record<
	ProjectRole,
	{
		badgeBg: string;
		badgeText: string;
		label: string;
	}
> = {
	ADMIN: {
		badgeBg: "bg-(--color-success-bg)",
		badgeText: "text-(--color-success)",
		label: "Admin",
	},
	EDITOR: {
		badgeBg: "bg-(--color-info-bg)",
		badgeText: "text-(--color-info)",
		label: "Editor",
	},
	VIEWER: {
		badgeBg: "bg-(--color-secondary)",
		badgeText: "text-(--color-text)",
		label: "Viewer",
	},
};

const formatTimeUnit = (value: number, unit: string): string => {
	return `Updated ${String(value)} ${value === SINGLE_UNIT ? unit : unit + "s"} ago`;
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
	const diffMinutes = Math.floor(
		(now.getTime() - date.getTime()) / (MS_PER_SECOND * SECONDS_PER_MINUTE),
	);

	if (diffMinutes < SINGLE_UNIT) {
		return "Updated just now";
	}

	if (diffMinutes < MINUTES_PER_HOUR) {
		return formatTimeUnit(diffMinutes, "minute");
	}

	const diffHours = Math.floor(diffMinutes / MINUTES_PER_HOUR);

	if (diffHours < HOURS_PER_DAY) {
		return formatTimeUnit(diffHours, "hour");
	}

	const diffDays = Math.floor(diffHours / HOURS_PER_DAY);

	if (diffDays < DAYS_PER_WEEK) {
		return formatTimeUnit(diffDays, "day");
	}

	if (diffDays < DAYS_PER_YEAR) {
		const diffWeeks = Math.floor(diffDays / DAYS_PER_WEEK);
		return formatTimeUnit(diffWeeks, "week");
	}

	const diffYears = Math.floor(diffDays / DAYS_PER_YEAR);
	return `Updated more than ${String(diffYears)} ${diffYears === SINGLE_UNIT ? "year" : "years"} ago`;
};

const ProjectCard: React.FC<ProjectCardProperties> = ({
	description = "",
	id,
	name,
	onDelete,
	onEdit,
	onManageMembers,
	onSelect,
	role,
	updatedAt,
}) => {
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	const menuReference = useRef<HTMLDivElement>(null);

	const handleClick = useCallback(() => {
		onSelect?.(id);
	}, [id, onSelect]);

	const handleDelete = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			event.stopPropagation();
			setIsMenuOpen(false);
			onDelete?.();
		},
		[onDelete],
	);

	const handleEdit = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			event.stopPropagation();
			setIsMenuOpen(false);
			onEdit?.();
		},
		[onEdit],
	);

	const handleManageMembers = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			event.stopPropagation();
			setIsMenuOpen(false);
			onManageMembers?.();
		},
		[onManageMembers],
	);

	const handleKeyDown = useCallback(
		(event_: React.KeyboardEvent) => {
			if (event_.target !== event_.currentTarget) {
				return;
			}

			if (event_.key !== "Enter" && event_.key !== " ") {
				return;
			}

			event_.preventDefault();
			onSelect?.(id);
		},
		[id, onSelect],
	);

	const toggleMenu = useCallback(
		(event: React.MouseEvent<HTMLButtonElement>): void => {
			event.stopPropagation();
			setIsMenuOpen((previous) => !previous);
		},
		[],
	);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent): void => {
			if (
				menuReference.current &&
				!menuReference.current.contains(event.target as Node)
			) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const currentRoleConfig = roleConfig[role];
	const hasActions = Boolean(onEdit || onDelete || onManageMembers);
	const initials = getInitials(name);
	const avatarColor = getAvatarColor(id);

	return (
		<div
			className="group relative flex w-full min-w-0 cursor-pointer flex-col justify-between rounded-lg border border-border bg-(--color-surface) p-5 text-left shadow-(--shadow-sm) transition-all hover:border-(--color-control-inactive) hover:shadow-(--shadow-md)"
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
		>
			<div className="min-w-0">
				<div className="mb-4 flex items-center justify-between gap-2">
					<div
						className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-(length:--text-sm) font-semibold ${avatarColor.bg} ${avatarColor.text}`}
					>
						{initials}
					</div>

					<div
						className="relative flex items-center gap-1.5"
						ref={hasActions ? menuReference : undefined}
					>
						<span
							className={`rounded-full px-3 py-1 text-(length:--text-xs) font-medium ${currentRoleConfig.badgeBg} ${currentRoleConfig.badgeText}`}
						>
							{currentRoleConfig.label}
						</span>

						{hasActions && (
							<>
								<button
									aria-label={MORE_ACTIONS_LABEL}
									className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border-0 bg-transparent text-text-muted transition-colors hover:bg-(--color-secondary) hover:text-text"
									onClick={toggleMenu}
									type="button"
								>
									<div className="flex flex-row items-center -space-x-1 text-text-muted">
										<Icon name="bullet-point" size={10} />
										<Icon name="bullet-point" size={10} />
										<Icon name="bullet-point" size={10} />
									</div>
								</button>
								{isMenuOpen && (
									<div className="absolute right-0 top-full z-10 mt-1 flex w-max flex-col whitespace-nowrap rounded-lg border border-(--color-border-subtle) bg-(--color-surface) p-1 shadow-xl">
										{onManageMembers && (
											<button
												className="w-full cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1 text-left text-(length:--text-xs) font-normal text-text-muted transition-colors hover:bg-(--color-secondary) hover:text-text"
												onClick={handleManageMembers}
												type="button"
											>
												{MANAGE_PROJECT_MEMBERS_LABEL}
											</button>
										)}

										{onEdit && (
											<button
												className="w-full cursor-pointer rounded-md px-2.5 py-1 text-left text-(length:--text-xs) font-normal text-text-muted transition-colors hover:bg-(--color-secondary) hover:text-text"
												onClick={handleEdit}
												type="button"
											>
												Edit
											</button>
										)}

										{onDelete && (
											<button
												className="w-full cursor-pointer rounded-md px-2.5 py-1 text-left text-(length:--text-xs) font-normal text-error transition-colors hover:bg-error-bg hover:text-error-hover"
												onClick={handleDelete}
												type="button"
											>
												Delete
											</button>
										)}
									</div>
								)}
							</>
						)}
					</div>
				</div>

				<h3 className="mb-1 min-w-0 font-serif text-h4 font-normal wrap-break-word text-text">
					{name}
				</h3>
				<div className="h-11 min-w-0 overflow-x-hidden overflow-y-auto">
					{description && (
						<p className="wrap-break-word text-control leading-relaxed text-text-muted">
							{description}
						</p>
					)}
				</div>
			</div>

			<div className="mt-5 flex items-center justify-between gap-3 border-t border-(--color-border-subtle) pt-4">
				<span className="min-w-0 truncate text-(length:--text-sm) text-text-muted">
					{formatRelativeTime(updatedAt)}
				</span>
				<span
					aria-hidden="true"
					className="shrink-0 text-text-muted transition-colors group-hover:text-accent"
				>
					<Icon name="arrow-right-long" size={NAVIGATION_ARROW_SIZE} />
				</span>
			</div>
		</div>
	);
};

export { ProjectCard };
