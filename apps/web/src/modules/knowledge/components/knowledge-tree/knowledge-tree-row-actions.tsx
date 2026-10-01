import {
	KnowledgeNodeType,
	KnowledgeValidationRule,
} from "@knowledgeprism/constants";
import { type KnowledgeTreeItemResponseDto } from "@knowledgeprism/types";
import React, { useCallback, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Button, Modal } from "~/components/components.js";
import { useAppDispatch, useCurrentProjectId } from "~/hooks/hooks.js";

import { actions } from "../../knowledge.js";
import { EMPTY_LENGTH } from "../../libs/constants/constants.js";
import {
	canAddSubdocument,
	canPlaceDocument,
	type DocumentPlacement,
	isDocumentNode,
	planMoveToParent,
} from "../../libs/helpers/helpers.js";
import { KnowledgeTreeDocumentForm } from "./knowledge-tree-document-form.js";
import {
	KnowledgeTreeRowMenu,
	type RowMenuItem,
} from "./knowledge-tree-row-menu.js";

const ROOT_LABEL = "Top level";
const PATH_SEPARATOR = " / ";

type MoveOption = {
	label: string;
	placement: DocumentPlacement;
};

type Properties = {
	isPending: boolean;
	item: KnowledgeTreeItemResponseDto;
	items: KnowledgeTreeItemResponseDto[];
	onCreateDocument: (title: string, parentId: number) => void;
	onEdit?: ((id: number) => void) | undefined;
	onMoveDocument: (id: number, placement: DocumentPlacement) => void;
	onSelect: (id: number) => void;
};

const getPathLabel = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
): string => {
	const titles: string[] = [];
	const seen = new Set<number>();
	let current = items.find((item) => item.id === nodeId);

	while (current && !seen.has(current.id)) {
		seen.add(current.id);
		titles.unshift(current.title);
		const parentId: null | number = current.parentId;
		current = items.find((item) => item.id === parentId);
	}

	return titles.join(PATH_SEPARATOR);
};

const getMoveOptions = (
	items: KnowledgeTreeItemResponseDto[],
	nodeId: number,
): MoveOption[] => {
	const rootPlacement = planMoveToParent(items, nodeId, null);
	const options: MoveOption[] = rootPlacement
		? [{ label: ROOT_LABEL, placement: rootPlacement }]
		: [];

	for (const candidate of items) {
		if (
			!isDocumentNode(candidate.type) ||
			!canPlaceDocument(items, nodeId, candidate.id)
		) {
			continue;
		}

		const placement = planMoveToParent(items, nodeId, candidate.id);

		if (placement) {
			options.push({
				label: getPathLabel(items, candidate.id),
				placement,
			});
		}
	}

	return options;
};

type MoveListButtonProperties = {
	onPick: (option: MoveOption) => void;
	option: MoveOption;
};

const MoveListButton: React.FC<MoveListButtonProperties> = ({
	onPick,
	option,
}: MoveListButtonProperties) => {
	const handleClick = useCallback((): void => {
		onPick(option);
	}, [onPick, option]);

	return (
		<button
			className="w-full cursor-pointer rounded-md px-3 py-2 text-left text-sm text-text hover:bg-border-subtle focus-visible:ring-3 focus-visible:ring-accent/35 focus-visible:outline-none"
			onClick={handleClick}
			type="button"
		>
			{option.label}
		</button>
	);
};

type MoveListProperties = {
	onCancel: () => void;
	onPick: (option: MoveOption) => void;
	options: MoveOption[];
};

const MoveList: React.FC<MoveListProperties> = ({
	onCancel,
	onPick,
	options,
}: MoveListProperties) => (
	<>
		<ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
			{options.map((option) => (
				<li key={option.label}>
					<MoveListButton onPick={onPick} option={option} />
				</li>
			))}
		</ul>
		<div className="mt-6 flex justify-end">
			<Button onClick={onCancel} type="button" variant="secondary">
				Cancel
			</Button>
		</div>
	</>
);

type RenameFormProperties = {
	initialTitle: string;
	isPending: boolean;
	onCancel: () => void;
	onSubmit: (title: string) => void;
};

const RenameForm: React.FC<RenameFormProperties> = ({
	initialTitle,
	isPending,
	onCancel,
	onSubmit,
}: RenameFormProperties) => {
	const titleId = useId();
	const [title, setTitle] = useState(initialTitle);
	const trimmedTitle = title.trim();

	const handleChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>): void => {
			setTitle(event.target.value);
		},
		[],
	);

	const handleSubmit = useCallback(
		(event: React.SubmitEvent<HTMLFormElement>): void => {
			event.preventDefault();

			if (!isPending && trimmedTitle.length > EMPTY_LENGTH) {
				onSubmit(trimmedTitle);
			}
		},
		[isPending, onSubmit, trimmedTitle],
	);

	return (
		<form className="flex flex-col gap-3" onSubmit={handleSubmit}>
			<label className="text-xs font-medium text-text-muted" htmlFor={titleId}>
				Title
			</label>
			<input
				className="h-9 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text outline-none focus:border-accent"
				disabled={isPending}
				id={titleId}
				maxLength={KnowledgeValidationRule.TITLE_MAXIMUM_LENGTH}
				onChange={handleChange}
				type="text"
				value={title}
			/>
			<div className="mt-3 flex justify-end gap-3">
				<Button
					disabled={isPending}
					onClick={onCancel}
					type="button"
					variant="secondary"
				>
					Cancel
				</Button>
				<Button
					disabled={isPending || trimmedTitle.length === EMPTY_LENGTH}
					isLoading={isPending}
					type="submit"
					variant="primary"
				>
					Save
				</Button>
			</div>
		</form>
	);
};

const KnowledgeTreeRowActions: React.FC<Properties> = ({
	isPending,
	item,
	items,
	onCreateDocument,
	onEdit,
	onMoveDocument,
	onSelect,
}: Properties) => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const [searchParameters] = useSearchParams();
	const [isRenaming, setIsRenaming] = useState(false);
	const [isSavingRename, setIsSavingRename] = useState(false);
	const [isAdding, setIsAdding] = useState(false);
	const [isMoving, setIsMoving] = useState(false);
	const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
	const isDocument = isDocumentNode(item.type);
	const hasChildren = items.some((candidate) => candidate.parentId === item.id);
	const moveOptions = useMemo(
		() => (isDocument ? getMoveOptions(items, item.id) : []),
		[isDocument, item.id, items],
	);

	const closeRename = useCallback((): void => {
		if (!isSavingRename) {
			setIsRenaming(false);
		}
	}, [isSavingRename]);

	const closeAdd = useCallback((): void => {
		setIsAdding(false);
	}, []);

	const closeMove = useCallback((): void => {
		setIsMoving(false);
	}, []);

	const closeDelete = useCallback((): void => {
		if (!isPending) {
			setIsConfirmingDelete(false);
		}
	}, [isPending]);

	const handleRename = useCallback(
		(title: string): void => {
			setIsSavingRename(true);
			onSelect(item.id);

			void dispatch(
				actions.fetchKnowledgeEntry({ entryId: item.id, projectId }),
			)
				.unwrap()
				.then((entry) =>
					dispatch(
						actions.updateKnowledgeEntry({
							entryId: item.id,
							payload: { contentJson: entry.contentJson, title },
							projectId,
						}),
					).unwrap(),
				)
				.then(() => {
					setIsRenaming(false);
				})
				.catch(() => {
					return;
				})
				.finally(() => {
					setIsSavingRename(false);
				});
		},
		[dispatch, item.id, onSelect, projectId],
	);

	const handleCreate = useCallback(
		(title: string): void => {
			onCreateDocument(title, item.id);
			setIsAdding(false);
		},
		[item.id, onCreateDocument],
	);

	const handlePickMove = useCallback(
		(option: MoveOption): void => {
			onMoveDocument(item.id, option.placement);
			setIsMoving(false);
		},
		[item.id, onMoveDocument],
	);

	const handleConfirmDelete = useCallback((): void => {
		if (isPending) {
			return;
		}

		const removeNode = () => {
			if (item.type === KnowledgeNodeType.ENTRY) {
				return dispatch(
					actions.removeKnowledgeSection({ projectId, sectionId: item.id }),
				);
			}

			return dispatch(
				actions.removeDocumentNode({
					documentId: item.id,
					projectId,
					queryNodeId: searchParameters.get("nodeId"),
				}),
			);
		};

		const request = removeNode();

		void request.unwrap().catch(() => {
			setIsConfirmingDelete(false);
		});
	}, [dispatch, isPending, item.id, item.type, projectId, searchParameters]);

	const menuItems = useMemo((): RowMenuItem[] => {
		const entries: RowMenuItem[] = [
			{
				label: "Rename",
				onSelect: () => {
					setIsRenaming(true);
				},
			},
		];

		if (canAddSubdocument(items, item.id)) {
			entries.push({
				label: "Add subpage",
				onSelect: () => {
					setIsAdding(true);
				},
			});
		}

		if (moveOptions.length > EMPTY_LENGTH) {
			entries.push({
				label: "Move to…",
				onSelect: () => {
					setIsMoving(true);
				},
			});
		}

		if (onEdit) {
			entries.push({
				label: "Edit content",
				onSelect: () => {
					onEdit(item.id);
				},
			});
		}

		entries.push({
			isDanger: true,
			label: "Delete",
			onSelect: () => {
				setIsConfirmingDelete(true);
			},
		});

		return entries;
	}, [item.id, items, moveOptions.length, onEdit]);

	return (
		<>
			<KnowledgeTreeRowMenu items={menuItems} title={item.title} />
			{isRenaming && (
				<Modal isOpen onClose={closeRename} title="Rename">
					<RenameForm
						initialTitle={item.title}
						isPending={isSavingRename}
						onCancel={closeRename}
						onSubmit={handleRename}
					/>
				</Modal>
			)}
			{isAdding && (
				<Modal isOpen onClose={closeAdd} title="Add subpage">
					<KnowledgeTreeDocumentForm
						isPending={isPending}
						onSubmit={handleCreate}
						submitLabel="Add subpage"
					/>
				</Modal>
			)}
			{isMoving && (
				<Modal isOpen onClose={closeMove} title={`Move ${item.title} to…`}>
					<MoveList
						onCancel={closeMove}
						onPick={handlePickMove}
						options={moveOptions}
					/>
				</Modal>
			)}
			{isConfirmingDelete && (
				<Modal isOpen onClose={closeDelete} title={`Delete ${item.title}?`}>
					<p className="text-sm leading-[1.6] text-text">
						This can&apos;t be undone.
						{hasChildren && " Everything nested under it is deleted too."}
					</p>
					<div className="mt-6 flex justify-end gap-3">
						<Button
							disabled={isPending}
							onClick={closeDelete}
							type="button"
							variant="secondary"
						>
							Cancel
						</Button>
						<Button
							disabled={isPending}
							isLoading={isPending}
							onClick={handleConfirmDelete}
							type="button"
							variant="destructive"
						>
							Delete
						</Button>
					</div>
				</Modal>
			)}
		</>
	);
};

export { KnowledgeTreeRowActions };
