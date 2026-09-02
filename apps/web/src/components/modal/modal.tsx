type ModalProps = {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
};

const Modal = ({
	isOpen,
	onClose,
	title,
	children,
}: ModalProps): React.ReactElement | null => {
	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="modal-overlay"
			onClick={onClose}
			style={{
				position: "fixed",
				inset: 0,
				background: "rgba(0, 0, 0, 0.5)",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				zIndex: 1000,
			}}
		>
			<div
				className="modal"
				onClick={(event) => event.stopPropagation()}
				style={{
					background: "#fff",
					borderRadius: 12,
					padding: 24,
					width: "min(520px, 90vw)",
					boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
				}}
			>
				<div
					className="modal__header"
					style={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						marginBottom: 16,
					}}
				>
					<h2 style={{ margin: 0 }}>{title}</h2>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close modal"
						style={{
							border: "none",
							background: "transparent",
							fontSize: 24,
							cursor: "pointer",
						}}
					>
						×
					</button>
				</div>

				<div className="modal__content">{children}</div>
			</div>
		</div>
	);
};

export { Modal };
