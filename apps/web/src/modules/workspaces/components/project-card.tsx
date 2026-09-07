import React, { useCallback, useState } from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";

interface AvatarProperties {
	index: number;
	url?: string;
}

interface ProjectCardProperties {
	description?: string;
	id: string;
	members?: string[];
	name: string;
	onDelete?: (id: string) => void;
	onEdit?: (id: string) => void;
	onSelect?: (id: string) => void;
	role: ProjectRole;
	updatedAt: string;
}

type ProjectRole = "ADMIN" | "EDITOR" | "VIEWER";

const EMPTY_ARRAY_LENGTH = 0;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const SINGLE_UNIT = 1;
const INDEX_OFFSET = 1;

const AVATAR_LIST = [
	"/avatars/avatar-5c4764.jpg",
	"/avatars/avatar-7fd8ac.jpg",
	"/avatars/avatar-8d39d3.jpg",
	"/avatars/avatar-744eba.jpg",
	"/avatars/avatar-24253a.jpg",
	"/avatars/avatar-aa06d3.jpg",
	"/avatars/avatar-b7c172.jpg",
];

const DEFAULT_AVATAR = "/avatars/avatar-user-6f7f8b.jpg";

const formatRelativeTime = (dateString: string): string => {
	if (!dateString) {
		return "";
	}

	if (!dateString.includes("T")) {
		return dateString.toUpperCase();
	}

	const date = new Date(dateString);
	const now = new Date();
	const diffHours = Math.floor(
		(now.getTime() - date.getTime()) /
			(MS_PER_SECOND * SECONDS_PER_MINUTE * MINUTES_PER_HOUR),
	);

	if (diffHours < HOURS_PER_DAY) {
		return `${String(Math.max(SINGLE_UNIT, diffHours))}H AGO`;
	}

	const diffDays = Math.floor(diffHours / HOURS_PER_DAY);

	if (diffDays < DAYS_PER_WEEK) {
		return `${String(diffDays)} DAYS AGO`;
	}

	const diffWeeks = Math.floor(diffDays / DAYS_PER_WEEK);

	return `${String(diffWeeks)} ${diffWeeks === SINGLE_UNIT ? "WEEK" : "WEEKS"} AGO`;
};

const roleConfig: Record<
	ProjectRole,
	{
		bgGradient: string;
		icon: React.ReactNode;
		iconColor: string;
	}
> = {
	ADMIN: {
		bgGradient: "bg-gradient-to-br from-[#EEF6F3] to-[#DCECE7]",
		icon: (
			<svg fill="none" height="22" viewBox="0 0 24 24" width="22">
				<rect
					height="20"
					rx="2.5"
					stroke="currentColor"
					strokeWidth="1.4"
					width="12"
					x="6"
					y="2"
				/>
				<circle cx="12" cy="18" fill="currentColor" r="1" />
			</svg>
		),
		iconColor: "text-[#2A6B5A]",
	},
	EDITOR: {
		bgGradient: "bg-gradient-to-br from-[#FDF0EF] to-[#FFE6E3]",
		icon: (
			<svg fill="none" height="22" viewBox="0 0 24 24" width="22">
				<rect
					height="18"
					rx="3"
					stroke="currentColor"
					strokeWidth="1.4"
					width="16"
					x="4"
					y="3"
				/>
				<circle cx="12" cy="18" fill="currentColor" r="1" />
			</svg>
		),
		iconColor: "text-[#C4433A]",
	},
	VIEWER: {
		bgGradient: "bg-gradient-to-br from-[#F2F0EC] to-[#E5E2DB]",
		icon: (
			<svg fill="none" height="22" viewBox="0 0 24 24" width="22">
				<rect
					height="13"
					rx="1.5"
					stroke="currentColor"
					strokeWidth="1.4"
					width="18"
					x="3"
					y="4"
				/>
				<path d="M8 20h8" stroke="currentColor" strokeWidth="1.4" />
			</svg>
		),
		iconColor: "text-[#6B665F]",
	},
};

const Avatar: React.FC<AvatarProperties> = ({ index, url }) => {
	const avatarSource =
		url || AVATAR_LIST[index % AVATAR_LIST.length] || DEFAULT_AVATAR;

	const [imageSource, setImageSource] = useState(avatarSource);

	const handleError = useCallback(() => {
		setImageSource(DEFAULT_AVATAR);
	}, []);

	return (
		<img
			alt={`Member ${String(index + INDEX_OFFSET)}`}
			className="h-6 w-6 rounded-full border-2 border-white object-cover bg-[#EBE8E1]"
			onError={handleError}
			src={imageSource}
		/>
	);
};

const ProjectCard: React.FC<ProjectCardProperties> = ({
	description = "",
	id,
	members,
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

	const handleEdit = useCallback(
		(event_: React.MouseEvent) => {
			event_.stopPropagation();
			onEdit?.(id);
		},
		[id, onEdit],
	);

	const handleDelete = useCallback(
		(event_: React.MouseEvent) => {
			event_.stopPropagation();
			onDelete?.(id);
		},
		[id, onDelete],
	);

	const canEdit = Boolean(onEdit);
	const canDelete = Boolean(onDelete);
	const shouldShowActions = Boolean(onEdit) || Boolean(onDelete);

	return (
		<div
			className={getValidClassNames(
				"group flex flex-col w-full text-left overflow-hidden rounded-xl border border-[#EBE8E1] bg-white transition-all hover:shadow-md cursor-pointer relative",
			)}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
		>
			<div
				className={getValidClassNames(
					"flex h-24 items-start justify-between p-3.5",
					roleConfig[role].bgGradient,
				)}
			>
				<div className={roleConfig[role].iconColor}>
					{roleConfig[role].icon}
				</div>

				<div className="flex items-center gap-1.5">
					{shouldShowActions && (
						<div className="flex items-center gap-1 rounded-md bg-white/80 p-0.5 backdrop-blur-xs">
							{canEdit && (
								<button
									className="p-1 text-[#6B665F] hover:bg-black/5 hover:text-[#1C1A17] rounded transition-colors cursor-pointer"
									onClick={handleEdit}
									title="Edit Project"
									type="button"
								>
									<svg fill="none" height="14" viewBox="0 0 24 24" width="14">
										<path
											d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
										/>
										<path
											d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
										/>
									</svg>
								</button>
							)}
							{canDelete && (
								<button
									className="p-1 text-[#C4433A] hover:bg-[#FFE6E3] rounded transition-colors cursor-pointer"
									onClick={handleDelete}
									title="Delete Project"
									type="button"
								>
									<svg fill="none" height="14" viewBox="0 0 24 24" width="14">
										<path
											d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
										/>
									</svg>
								</button>
							)}
						</div>
					)}

					<span className="rounded bg-[#F2F0EC]/80 px-2 py-0.5 font-mono text-[9.5px] font-medium tracking-wider text-[#6B665F]">
						{role}
					</span>
				</div>
			</div>

			<div className="flex flex-1 flex-col gap-2.5 p-[16px_18px_18px]">
				<h3 className="font-serif text-lg font-normal text-[#1C1A17] leading-snug">
					{name}
				</h3>

				{description && (
					<p className="flex-1 text-[12.5px] leading-relaxed text-[#706E6B]">
						{description}
					</p>
				)}

				<div className="mt-1 flex items-center justify-between border-t border-[#F2F0EC] pt-3">
					<span className="font-mono text-[10px] text-[#A8A299]">
						UPDATED {formatRelativeTime(updatedAt)}
					</span>

					<div className="flex -space-x-1.5 overflow-hidden">
						{members &&
							members.length > EMPTY_ARRAY_LENGTH &&
							members.map((url, index) => {
								const avatarSource =
									url ||
									AVATAR_LIST[index % AVATAR_LIST.length] ||
									DEFAULT_AVATAR;

								return (
									<Avatar
										index={index}
										key={`${avatarSource}-${String(index)}`}
										url={url}
									/>
								);
							})}
					</div>
				</div>
			</div>
		</div>
	);
};

export { type ProjectRole, ProjectCard };
