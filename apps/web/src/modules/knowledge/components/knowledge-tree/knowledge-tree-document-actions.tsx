import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import React, { useCallback, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button, Modal } from "~/components/components.js";
import { useAppDispatch, useCurrentProjectId } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import {
	canAddSubdocument,
	type DocumentPlacement,
	planMoveDown,
	planMoveOut,
	planMoveUp,
	planNestUnderPrevious,
} from "../../libs/helpers/helpers.js";
import { KnowledgeTreeDocumentForm } from "./knowledge-tree-document-form.js";

type Properties = {
	isPending: boolean;
	itemId: number;
	items: KnowledgeTreeItemResponseDto[];
	onCreateDocument: (title: string, parentId: number) => void;
	onMoveDocument: (id: number, placement: DocumentPlacement) => void;
};

const KnowledgeTreeDocumentActions: React.FC<Properties> = ({
	isPending,
	itemId,
	items,
	onCreateDocument,
	onMoveDocument,
}: Properties) => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const [searchParameters] = useSearchParams();
	const [isAdding, setIsAdding] = useState(false);
	const [isConfirmingRemove, setIsConfirmingRemove] = useState(false);
	const documentTitle =
		items.find((item) => item.id === itemId)?.title ?? "This document";
	const moveUp = planMoveUp(items, itemId);
	const moveDown = planMoveDown(items, itemId);
	const nest = planNestUnderPrevious(items, itemId);
	const moveOut = planMoveOut(items, itemId);
	const canAdd = canAddSubdocument(items, itemId);

	const handleMove = useCallback(
		(placement: DocumentPlacement | null): void => {
			if (!placement || isPending) {
				return;
			}

			onMoveDocument(itemId, placement);
		},
		[isPending, itemId, onMoveDocument],
	);

	const handleMoveUp = useCallback((): void => {
		handleMove(moveUp);
	}, [handleMove, moveUp]);

	const handleMoveDown = useCallback((): void => {
		handleMove(moveDown);
	}, [handleMove, moveDown]);

	const handleNest = useCallback((): void => {
		handleMove(nest);
	}, [handleMove, nest]);

	const handleMoveOut = useCallback((): void => {
		handleMove(moveOut);
	}, [handleMove, moveOut]);

	const handleShowAdd = useCallback((): void => {
		setIsAdding(true);
	}, []);

	const handleShowRemove = useCallback((): void => {
		setIsConfirmingRemove(true);
	}, []);

	const handleCancelRemove = useCallback((): void => {
		if (isPending) {
			return;
		}

		setIsConfirmingRemove(false);
	}, [isPending]);

	const handleConfirmRemove = useCallback((): void => {
		if (isPending) {
			return;
		}

		void dispatch(
			actions.removeDocumentNode({
				documentId: itemId,
				projectId,
				queryNodeId: searchParameters.get("nodeId"),
			}),
		)
			.unwrap()
			.catch(() => {
				setIsConfirmingRemove(false);
			});
	}, [dispatch, isPending, itemId, projectId, searchParameters]);

	const handleCreate = useCallback(
		(title: string): void => {
			onCreateDocument(title, itemId);
			setIsAdding(false);
		},
		[itemId, onCreateDocument],
	);

	return (
		<div className="flex flex-col gap-2 px-2.5 pb-2">
			<div className="flex flex-wrap gap-1.5">
				{moveUp && (
					<Button
						className="px-2! py-1! text-xs"
						disabled={isPending}
						onClick={handleMoveUp}
						type="button"
						variant="secondary"
					>
						Move up
					</Button>
				)}
				{moveDown && (
					<Button
						className="px-2! py-1! text-xs"
						disabled={isPending}
						onClick={handleMoveDown}
						type="button"
						variant="secondary"
					>
						Move down
					</Button>
				)}
				{nest && (
					<Button
						className="px-2! py-1! text-xs"
						disabled={isPending}
						onClick={handleNest}
						type="button"
						variant="secondary"
					>
						Nest under previous
					</Button>
				)}
				{moveOut && (
					<Button
						className="px-2! py-1! text-xs"
						disabled={isPending}
						onClick={handleMoveOut}
						type="button"
						variant="secondary"
					>
						Move out
					</Button>
				)}
				{canAdd && !isAdding && (
					<Button
						className="px-2! py-1! text-xs"
						disabled={isPending}
						onClick={handleShowAdd}
						type="button"
						variant="secondary"
					>
						Add subdocument
					</Button>
				)}
				<Button
					aria-label={`Remove ${documentTitle}`}
					className="px-2! py-1! text-xs"
					disabled={isPending}
					onClick={handleShowRemove}
					type="button"
					variant="secondary"
				>
					Remove
				</Button>
			</div>
			{isConfirmingRemove && (
				<Modal isOpen onClose={handleCancelRemove} title="Remove document?">
					<p className="text-sm leading-[1.6] text-text">
						“{documentTitle}” and the documents nested under it will be removed.
					</p>
					<div className="mt-6 flex justify-end gap-3">
						<Button
							disabled={isPending}
							onClick={handleCancelRemove}
							type="button"
							variant="secondary"
						>
							Cancel
						</Button>
						<Button
							disabled={isPending}
							isLoading={isPending}
							onClick={handleConfirmRemove}
							type="button"
							variant="destructive"
						>
							Remove
						</Button>
					</div>
				</Modal>
			)}
			{isAdding && (
				<KnowledgeTreeDocumentForm
					isPending={isPending}
					onSubmit={handleCreate}
					submitLabel="Add subdocument"
				/>
			)}
		</div>
	);
};

export { KnowledgeTreeDocumentActions };
