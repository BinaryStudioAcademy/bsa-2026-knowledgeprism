import { useCallback, useState } from "~/hooks/hooks.js";

const Dropdown = (): React.JSX.Element => {
	const [isOpen, setIsOpen] = useState(false);
	const handleToggle = useCallback((): void => {
		setIsOpen((previous) => !previous);
	}, []);

	return (
		<div className="relative">
			<button
				className="btn btn-secondary cursor-pointer"
				onClick={handleToggle}
				type="button"
			>
				Actions
			</button>
			{isOpen && (
				<div className="dropdown-menu flex flex-col ">
					<button className="dropdown-item text-left" type="button">
						Duplicate
					</button>
					<button className="dropdown-item text-left" type="button">
						Rename
					</button>
					<button className="dropdown-item text-left is-danger " type="button">
						Delete
					</button>
				</div>
			)}
		</div>
	);
};

export { Dropdown };
