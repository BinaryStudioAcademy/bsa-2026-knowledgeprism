import React, { useCallback, useState } from "react";
import { tv } from "tailwind-variants";

import { Icon } from "~/components/icon/icon.js";

import {
	KnowledgeNodeType,
	type KnowledgeTreeItemResponseDto,
} from "../../libs/mock-knowledge-tree.js";

type Properties = {
	item: KnowledgeTreeItemResponseDto;
	items: KnowledgeTreeItemResponseDto[];
	level?: number | undefined;
	onSelect: (id: number) => void;
	searchQuery?: string | undefined;
	selectedId?: number | undefined;
};

const DEFAULT_LEVEL = 0;
const BASE_PADDING = 10;
const LEVEL_MULTIPLIER = 16;
const EMPTY_LENGTH = 0;
const LEVEL_INCREMENT = 1;
const NOT_FOUND_INDEX = -1;
const START_INDEX = 0;

type HighlightedTextProperties = {
	highlight?: string | undefined;
	text: string;
};

const HighlightedText: React.FC<HighlightedTextProperties> = ({
	highlight = "",
	text,
}: HighlightedTextProperties) => {
	if (!highlight) {
		return <span className="truncate">{text}</span>;
	}

	const matchIndex = text.toLowerCase().indexOf(highlight.toLowerCase());

	if (matchIndex === NOT_FOUND_INDEX) {
		return <span className="truncate">{text}</span>;
	}

	const beforeString = text.slice(START_INDEX, matchIndex);
	const matchString = text.slice(matchIndex, matchIndex + highlight.length);
	const afterString = text.slice(matchIndex + highlight.length);

	return (
		<span className="truncate">
			{beforeString}
			<span className="bg-accent/20 text-accent">{matchString}</span>
			{afterString}
		</span>
	);
};

const treeItemVariants = tv({
	base: "flex w-full cursor-pointer items-center gap-2 rounded-[7px] px-2.5 py-2 text-sm transition-colors",
	variants: {
		isSelected: {
			false: "text-text-muted hover:bg-secondary",
			true: "bg-secondary font-medium text-text",
		},
	},
});

const KnowledgeTreeItem: React.FC<Properties> = ({
	item,
	items,
	level = DEFAULT_LEVEL,
	onSelect,
	searchQuery = "",
	selectedId,
}: Properties) => {
	const children = items
		.filter((child) => child.parentId === item.id)
		.toSorted((a, b) => a.position - b.position);

	const isSection = item.type === KnowledgeNodeType.SECTION;
	const isSelected = selectedId === item.id;
	const [isExpanded, setIsExpanded] = useState(true);

	const handleToggle = useCallback(
		(event_: React.MouseEvent) => {
			event_.stopPropagation();
			if (isSection) {
				setIsExpanded((previous) => !previous);
			} else {
				onSelect(item.id);
			}
		},
		[isSection, item.id, onSelect],
	);

	const paddingValue = Math.max(
		BASE_PADDING,
		level * LEVEL_MULTIPLIER + BASE_PADDING,
	);
	const paddingLeftString = `${String(paddingValue)}px`;

	return (
		<div className="flex flex-col gap-0.5">
			<button
				className={treeItemVariants({ isSelected })}
				onClick={handleToggle}
				style={{ paddingLeft: paddingLeftString }}
				type="button"
			>
				{isSection ? (
					<Icon name="folder" size={13} />
				) : (
					<Icon name="file-rounded" size={12} />
				)}
				<HighlightedText highlight={searchQuery} text={item.title} />
			</button>

			{isSection && isExpanded && children.length > EMPTY_LENGTH && (
				<div className="flex flex-col gap-0.5">
					{children.map((child) => (
						<KnowledgeTreeItem
							item={child}
							items={items}
							key={child.id}
							level={level + LEVEL_INCREMENT}
							onSelect={onSelect}
							searchQuery={searchQuery}
							selectedId={selectedId}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export { KnowledgeTreeItem };
