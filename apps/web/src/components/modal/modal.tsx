type ModalProperties = {
	children: React.ReactNode;
	isOpen: boolean;
	onClose: () => void;
	title?: string;
};

const Modal = ({
	children,
	isOpen,
	onClose,
	title = "Modal",
}: ModalProperties): null | React.JSX.Element => {
	if (!isOpen) {
		return null;
	}

	const closeButtonProperties = {
		"aria-label": "Close modal",
		className: "modal__close-button",
		onClick: onClose,
		type: "button" as const,
	};

	return (
		<div className="modal-backdrop">
			<div aria-modal="true" className="modal" role="dialog">
				<div className="modal__header">
					<h2 className="modal__title">{title}</h2>
					<button {...closeButtonProperties}>×</button>
				</div>

				<div className="modal__body">{children}</div>
			</div>
		</div>
	);
};

export { Modal };
