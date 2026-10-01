import React, { useCallback, useEffect, useRef, useState } from "react";

const FOCUS_STEP = 1;
const FIRST_ITEM_INDEX = 0;
const MENU_ICON_SIZE = 12;

type Properties = {
	items: RowMenuItem[];
	title: string;
};

type RowMenuItem = {
	isDanger?: boolean;
	label: string;
	onSelect: () => void;
};

const getMenuButtons = (menu: HTMLElement | null): HTMLButtonElement[] => {
	return menu
		? [...menu.querySelectorAll<HTMLButtonElement>("[role='menuitem']")]
		: [];
};

const KnowledgeTreeRowMenu: React.FC<Properties> = ({
	items,
	title,
}: Properties) => {
	const [isOpen, setIsOpen] = useState(false);
	const containerReference = useRef<HTMLDivElement>(null);
	const triggerReference = useRef<HTMLButtonElement>(null);
	const menuReference = useRef<HTMLDivElement>(null);

	const handleToggle = useCallback((): void => {
		setIsOpen((previous) => !previous);
	}, []);

	const handleDismiss = useCallback((): void => {
		setIsOpen(false);
		triggerReference.current?.focus();
	}, []);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		getMenuButtons(menuReference.current)[FIRST_ITEM_INDEX]?.focus();

		const handlePointerDown = (event: MouseEvent): void => {
			if (
				event.target instanceof Node &&
				!containerReference.current?.contains(event.target)
			) {
				setIsOpen(false);
			}
		};

		document.addEventListener("mousedown", handlePointerDown);

		return (): void => {
			document.removeEventListener("mousedown", handlePointerDown);
		};
	}, [isOpen]);

	const handleKeyDown = useCallback(
		(event: React.KeyboardEvent<HTMLDivElement>): void => {
			if (isOpen && event.key === "Escape") {
				event.stopPropagation();
				handleDismiss();
				return;
			}

			if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
				return;
			}

			const buttons = getMenuButtons(menuReference.current);
			const currentIndex = buttons.indexOf(
				document.activeElement as HTMLButtonElement,
			);
			const step = event.key === "ArrowDown" ? FOCUS_STEP : -FOCUS_STEP;
			const nextIndex = (currentIndex + step + buttons.length) % buttons.length;

			event.preventDefault();
			buttons[nextIndex]?.focus();
		},
		[handleDismiss, isOpen],
	);

	const handleSelect = useCallback((item: RowMenuItem): void => {
		setIsOpen(false);
		item.onSelect();
	}, []);

	return (
		<div
			className="absolute inset-y-0 right-1 z-10 flex items-center"
			onKeyDown={handleKeyDown}
			ref={containerReference}
			role="none"
		>
			<button
				aria-expanded={isOpen}
				aria-haspopup="menu"
				aria-label={`More actions for ${title}`}
				className={`flex size-6 cursor-pointer items-center justify-center rounded text-text-muted hover:bg-border-subtle hover:text-text focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-accent/35 focus-visible:outline-none group-focus-within:opacity-100 group-hover:opacity-100 ${isOpen ? "opacity-100" : "opacity-0"}`}
				onClick={handleToggle}
				ref={triggerReference}
				type="button"
			>
				<svg
					aria-hidden="true"
					fill="currentColor"
					height={MENU_ICON_SIZE}
					viewBox="0 0 16 16"
					width={MENU_ICON_SIZE}
				>
					<circle cx="3" cy="8" r="1.4" />
					<circle cx="8" cy="8" r="1.4" />
					<circle cx="13" cy="8" r="1.4" />
				</svg>
			</button>
			{isOpen && (
				<div
					aria-label={`Actions for ${title}`}
					className="dropdown-menu top-full! right-0 left-auto!"
					ref={menuReference}
					role="menu"
				>
					{items.map((item) => (
						<RowMenuButton
							item={item}
							key={item.label}
							onSelect={handleSelect}
						/>
					))}
				</div>
			)}
		</div>
	);
};

type RowMenuButtonProperties = {
	item: RowMenuItem;
	onSelect: (item: RowMenuItem) => void;
};

const RowMenuButton: React.FC<RowMenuButtonProperties> = ({
	item,
	onSelect,
}: RowMenuButtonProperties) => {
	const handleClick = useCallback((): void => {
		onSelect(item);
	}, [item, onSelect]);

	return (
		<button
			className={`dropdown-item${item.isDanger ? " is-danger" : ""}`}
			onClick={handleClick}
			role="menuitem"
			type="button"
		>
			{item.label}
		</button>
	);
};

export { type RowMenuItem, KnowledgeTreeRowMenu };
