import {
	type JSX,
	type KeyboardEvent,
	type MouseEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";

import { type PlacementTarget } from "../../../../libs/types/types.js";

const DOCUMENT_PAGE_LABEL = "This document's page";
const ICON_SIZE = 14;
const ICON_VIEW_BOX = "0 0 16 16";
const MENU_TAB_INDEX = -1;

type Properties = {
	isDisabled: boolean;
	onDiscard: () => void;
	onMoveTo: (targetId: null | number) => void;
	onRename: () => void;
	placementTargets: PlacementTarget[];
	title: string;
};

const SectionRowMenu = ({
	isDisabled,
	onDiscard,
	onMoveTo,
	onRename,
	placementTargets,
	title,
}: Properties): JSX.Element => {
	const [isOpen, setIsOpen] = useState(false);
	const [isChoosingTarget, setIsChoosingTarget] = useState(false);
	const containerReference = useRef<HTMLDivElement | null>(null);

	const close = useCallback((): void => {
		setIsOpen(false);
		setIsChoosingTarget(false);
	}, []);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handlePointerDown = (event: PointerEvent): void => {
			if (!containerReference.current?.contains(event.target as Node)) {
				close();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown);

		return (): void => {
			document.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [close, isOpen]);

	const handleToggle = useCallback((): void => {
		setIsOpen((previous) => !previous);
		setIsChoosingTarget(false);
	}, []);

	const handleKeyDown = useCallback(
		(event: KeyboardEvent<HTMLElement>): void => {
			if (event.key === "Escape") {
				close();
			}
		},
		[close],
	);

	const handleRename = useCallback((): void => {
		close();
		onRename();
	}, [close, onRename]);

	const handleChooseTarget = useCallback((): void => {
		setIsChoosingTarget(true);
	}, []);

	const handleMoveTo = useCallback(
		(event: MouseEvent<HTMLButtonElement>): void => {
			const rawTargetId = event.currentTarget.dataset["targetId"];
			close();
			onMoveTo(rawTargetId ? Number(rawTargetId) : null);
		},
		[close, onMoveTo],
	);

	const handleDiscard = useCallback((): void => {
		close();
		onDiscard();
	}, [close, onDiscard]);

	return (
		<div className="relative shrink-0" ref={containerReference}>
			<button
				aria-expanded={isOpen}
				aria-haspopup="menu"
				aria-label={`More actions for ${title}`}
				className="flex items-center justify-center rounded p-1 text-text-faint hover:bg-secondary hover:text-text-muted disabled:cursor-not-allowed disabled:opacity-40"
				disabled={isDisabled}
				onClick={handleToggle}
				onKeyDown={handleKeyDown}
				type="button"
			>
				<svg
					aria-hidden="true"
					fill="currentColor"
					height={ICON_SIZE}
					viewBox={ICON_VIEW_BOX}
					width={ICON_SIZE}
				>
					<circle cx="3" cy="8" r="1.4" />
					<circle cx="8" cy="8" r="1.4" />
					<circle cx="13" cy="8" r="1.4" />
				</svg>
			</button>
			{isOpen && (
				<div
					className="dropdown-menu absolute left-auto right-0 z-20 mt-1 min-w-52"
					onKeyDown={handleKeyDown}
					role="menu"
					tabIndex={MENU_TAB_INDEX}
				>
					{isChoosingTarget ? (
						<>
							<button
								className="dropdown-item"
								onClick={handleMoveTo}
								role="menuitem"
								type="button"
							>
								{DOCUMENT_PAGE_LABEL}
							</button>
							{placementTargets.map((target) => (
								<button
									className="dropdown-item"
									data-target-id={target.id}
									key={target.id}
									onClick={handleMoveTo}
									role="menuitem"
									type="button"
								>
									{target.title}
								</button>
							))}
						</>
					) : (
						<>
							<button
								className="dropdown-item"
								onClick={handleRename}
								role="menuitem"
								type="button"
							>
								Rename
							</button>
							<button
								className="dropdown-item"
								onClick={handleChooseTarget}
								role="menuitem"
								type="button"
							>
								Move to…
							</button>
							<button
								className="dropdown-item is-danger"
								onClick={handleDiscard}
								role="menuitem"
								type="button"
							>
								Discard
							</button>
						</>
					)}
				</div>
			)}
		</div>
	);
};

export { DOCUMENT_PAGE_LABEL, SectionRowMenu };
