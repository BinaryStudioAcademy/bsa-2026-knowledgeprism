import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import React, { useCallback, useMemo, useState } from "react";

import {
	type DocumentPlacement,
	DropZone,
	type DropZoneValue,
	isDocumentNode,
	planDrop,
} from "../../libs/helpers/helpers.js";

const EDGE_ZONE_RATIO = 0.25;
const FAR_EDGE_RATIO = 0.75;
const HALF_RATIO = 0.5;
const NO_HEIGHT = 0;

type DropIndicator = {
	targetId: number;
	zone: DropZoneValue;
};

type KnowledgeTreeDrag = {
	draggedId: number | undefined;
	indicator: DropIndicator | null;
	onDragEnd: () => void;
	onDragOver: (event: React.DragEvent<HTMLElement>, targetId: number) => void;
	onDragStart: (event: React.DragEvent<HTMLElement>, id: number) => void;
	onDrop: (event: React.DragEvent<HTMLElement>, targetId: number) => void;
};

const getDropZone = (
	clientY: number,
	rect: Pick<DOMRect, "height" | "top">,
	canNest: boolean,
): DropZoneValue => {
	if (rect.height === NO_HEIGHT) {
		return canNest ? DropZone.INSIDE : DropZone.AFTER;
	}

	const ratio = (clientY - rect.top) / rect.height;

	if (canNest) {
		if (ratio < EDGE_ZONE_RATIO) {
			return DropZone.BEFORE;
		}

		return ratio > FAR_EDGE_RATIO ? DropZone.AFTER : DropZone.INSIDE;
	}

	return ratio < HALF_RATIO ? DropZone.BEFORE : DropZone.AFTER;
};

const useKnowledgeTreeDrag = (
	items: KnowledgeTreeItemResponseDto[],
	onMoveDocument:
		((id: number, placement: DocumentPlacement) => void) | undefined,
): KnowledgeTreeDrag => {
	const [draggedId, setDraggedId] = useState<number | undefined>();
	const [indicator, setIndicator] = useState<DropIndicator | null>(null);

	const reset = useCallback((): void => {
		setDraggedId(undefined);
		setIndicator(null);
	}, []);

	const resolveDrop = useCallback(
		(
			event: React.DragEvent<HTMLElement>,
			targetId: number,
		): null | { placement: DocumentPlacement; zone: DropZoneValue } => {
			const target = items.find((item) => item.id === targetId);

			if (draggedId === undefined || !target) {
				return null;
			}

			const zone = getDropZone(
				event.clientY,
				event.currentTarget.getBoundingClientRect(),
				isDocumentNode(target.type),
			);
			const placement = planDrop(items, draggedId, { targetId, zone });

			return placement ? { placement, zone } : null;
		},
		[draggedId, items],
	);

	const handleDragStart = useCallback(
		(event: React.DragEvent<HTMLElement>, id: number): void => {
			event.dataTransfer.effectAllowed = "move";
			event.dataTransfer.setData("text/plain", String(id));
			setDraggedId(id);
		},
		[],
	);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLElement>, targetId: number): void => {
			const drop = resolveDrop(event, targetId);

			if (!drop) {
				setIndicator(null);
				return;
			}

			event.preventDefault();
			event.dataTransfer.dropEffect = "move";
			setIndicator((previous) =>
				previous?.targetId === targetId && previous.zone === drop.zone
					? previous
					: { targetId, zone: drop.zone },
			);
		},
		[resolveDrop],
	);

	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLElement>, targetId: number): void => {
			const drop = resolveDrop(event, targetId);

			if (drop && draggedId !== undefined && onMoveDocument) {
				event.preventDefault();
				onMoveDocument(draggedId, drop.placement);
			}

			reset();
		},
		[draggedId, onMoveDocument, reset, resolveDrop],
	);

	return useMemo(
		() => ({
			draggedId,
			indicator,
			onDragEnd: reset,
			onDragOver: handleDragOver,
			onDragStart: handleDragStart,
			onDrop: handleDrop,
		}),
		[draggedId, handleDragOver, handleDragStart, handleDrop, indicator, reset],
	);
};

export { type KnowledgeTreeDrag, useKnowledgeTreeDrag };
