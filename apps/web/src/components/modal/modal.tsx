type ModalProperties = {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	children: React.ReactNode;
};

const Modal: React.FC<ModalProperties> = ({
	isOpen,
	onClose,
	title = "Modal",
	children,
}): React.JSX.Element | null => {
	if (!isOpen) {
		return null;
	}

	return (
		<div className="modal-backdrop" onClick={onClose}>
			<div
				aria-modal="true"
				className="modal"
				onClick={(event) => event.stopPropagation()}
				role="dialog"
			>
				<div className="modal__header">
					<h2 className="modal__title">{title}</h2>
					<button
						aria-label="Close modal"
						className="modal__close-button"
						onClick={onClose}
						type="button"
					>
						×
					</button>
				</div>

				<div className="modal__body">{children}</div>
			</div>
		</div>
	);
};

export { Modal };
