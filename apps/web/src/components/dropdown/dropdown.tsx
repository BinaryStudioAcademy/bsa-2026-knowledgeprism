import { Button } from "~/components/button/button.js";
import { useCallback, useEffect, useRef, useState } from "~/hooks/hooks.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";

type DropdownItem = {
	isDanger?: boolean;
	label: string;
	onSelect: () => void;
};

type MenuItemProperties = {
	item: DropdownItem;
	onClose: () => void;
};

type Properties = {
	items: DropdownItem[];
	label: string;
};

const escapeKey = "Escape";

const Dropdown = ({ items, label }: Properties): React.JSX.Element => {
	const [isOpen, setIsOpen] = useState(false);
	const containerReference = useRef<HTMLDivElement>(null);

	const handleToggle = useCallback((): void => {
		setIsOpen((previous) => !previous);
	}, []);

	const handleClose = useCallback((): void => {
		setIsOpen(false);
	}, []);

	const handleDismiss = useCallback((): void => {
		handleClose();
		containerReference.current?.querySelector("button")?.focus();
	}, [handleClose]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleClickOutside = (event: MouseEvent): void => {
			const { target } = event;

			if (
				containerReference.current &&
				target instanceof Node &&
				!containerReference.current.contains(target)
			) {
				handleClose();
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return (): void => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isOpen, handleClose]);

	useEffect(() => {
		if (!isOpen) {
			return;
		}

		const handleKeyDown = (event: KeyboardEvent): void => {
			if (event.key === escapeKey) {
				handleDismiss();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return (): void => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [isOpen, handleDismiss]);

	return (
		<div className="relative" ref={containerReference}>
			<Button
				aria-expanded={isOpen}
				aria-haspopup="menu"
				className="cursor-pointer"
				onClick={handleToggle}
				type="button"
				variant="secondary"
			>
				{label}
			</Button>
			{isOpen && (
				<div className="dropdown-menu flex flex-col" role="menu">
					{items.map((item) => {
						return (
							<MenuItem item={item} key={item.label} onClose={handleDismiss} />
						);
					})}
				</div>
			)}
		</div>
	);
};

const MenuItem = ({ item, onClose }: MenuItemProperties): React.JSX.Element => {
	const handleClick = useCallback((): void => {
		item.onSelect();
		onClose();
	}, [item, onClose]);

	return (
		<button
			className={getValidClassNames(
				"dropdown-item",
				item.isDanger && "is-danger",
			)}
			onClick={handleClick}
			role="menuitem"
			type="button"
		>
			{item.label}
		</button>
	);
};

export { Dropdown };
export { type DropdownItem };
