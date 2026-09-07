import {
	type JSX,
	type ReactNode,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
} from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";

type Properties = {
	children: ReactNode;
	className?: string;
	isOpen: boolean;
	onClose: () => void;
	title: string;
};

const Modal = ({
	children,
	className = "",
	isOpen,
	onClose,
	title,
}: Properties): JSX.Element => {
	const dialogReference = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	useEffect(() => {
		const dialogElement = dialogReference.current;

		if (!dialogElement || !isOpen) {
			return;
		}

		if (!dialogElement.open) {
			dialogElement.showModal();
		}

		return (): void => {
			if (dialogElement.open) {
				dialogElement.close();
			}
		};
	}, [isOpen]);

	const handleCancel = useCallback(
		(event: SyntheticEvent<HTMLDialogElement>): void => {
			event.preventDefault();
			onClose();
		},
		[onClose],
	);

	return (
		<dialog
			aria-labelledby={titleId}
			className="fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-3.5 backdrop:bg-primary/40 open:grid open:place-items-center"
			onCancel={handleCancel}
			ref={dialogReference}
		>
			<div
				className={getValidClassNames(
					"modal relative z-10 max-h-full max-w-full overflow-y-auto text-text",
					className,
				)}
			>
				<h2
					className="mb-2.5 font-serif text-xl font-normal leading-tight"
					id={titleId}
				>
					{title}
				</h2>

				{children}
			</div>

			<button
				aria-label="Close modal"
				className="absolute inset-0 z-0 size-full cursor-default border-0 bg-transparent p-0"
				onClick={onClose}
				tabIndex={-1}
				type="button"
			/>
		</dialog>
	);
};

export { Modal };
