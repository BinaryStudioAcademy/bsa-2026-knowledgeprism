import { Button } from "~/components/button/button.js";
import { useCallback, useState } from "~/hooks/hooks.js";
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

const Dropdown = ({ items, label }: Properties): React.JSX.Element => {
	const [isOpen, setIsOpen] = useState(false);

	const handleToggle = useCallback((): void => {
		setIsOpen((previous) => !previous);
	}, []);

	const handleClose = useCallback((): void => {
		setIsOpen(false);
	}, []);

	return (
		<div className="relative">
			<Button
				className="cursor-pointer"
				onClick={handleToggle}
				type="button"
				variant="secondary"
			>
				{label}
			</Button>
			{isOpen && (
				<div className="dropdown-menu flex flex-col ">
					{items.map((item) => {
						return (
							<MenuItem item={item} key={item.label} onClose={handleClose} />
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
			type="button"
		>
			{item.label}
		</button>
	);
};

export { Dropdown };
