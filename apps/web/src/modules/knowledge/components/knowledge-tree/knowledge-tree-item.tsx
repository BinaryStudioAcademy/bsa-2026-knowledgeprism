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
	selectedId?: number | undefined;
};

const DEFAULT_LEVEL = 0;
const BASE_PADDING = 10;
const LEVEL_MULTIPLIER = 16;
const EMPTY_LENGTH = 0;
const LEVEL_INCREMENT = 1;

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
				<span className="truncate">{item.title}</span>
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
							selectedId={selectedId}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export { KnowledgeTreeItem };
