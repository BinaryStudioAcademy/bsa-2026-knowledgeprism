import React, { useCallback, useEffect, useRef, useState } from "react";

import { Icon } from "~/components/components.js";

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
	const hasActions = Boolean(onEdit || onDelete);
	const initials = getInitials(name);
	const avatarColor = getAvatarColor(id);

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
									aria-label="Project options"
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
									<div className="absolute left-0 right-0 top-full z-10 mt-1 flex flex-col rounded-lg border border-(--color-border-subtle) bg-(--color-surface) p-1 shadow-xl">
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
												className="w-full cursor-pointer rounded-md px-2.5 py-1 text-left text-(length:--text-xs) font-normal text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
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

				<h3 className="mb-1 font-serif text-h4 font-normal text-text wrap-break-words">
					{name}
				</h3>

				{description && (
					<p className="line-clamp-2 text-control leading-relaxed text-text-muted wrap-break-words">
						{description}
					</p>
				)}
			</div>

			<div className="mt-5 border-t border-(--color-border-subtle) pt-4">
				<span className="text-(length:--text-sm) text-text-muted">
					{formatRelativeTime(updatedAt)}
				</span>
			</div>
		</div>
	);
};

export { ProjectCard };
