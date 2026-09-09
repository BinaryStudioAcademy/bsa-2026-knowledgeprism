import {
	type JSX,
	type ReactNode,
	type SyntheticEvent,
	useCallback,
	useEffect,
	useId,
	useRef,
} from "react";
import { tv, type VariantProps } from "tailwind-variants";

import { Button } from "../button/button.js";
import { Icon } from "../icon/icon.js";

const modalStyles = tv({
	defaultVariants: {
		hasCloseButton: false,
		isFullScreenOnMobile: false,
		size: "small",
	},
	slots: {
		closeButton:
			"size-8 shrink-0 p-0 text-text-muted max-tablet:col-start-1 max-tablet:row-start-1 max-tablet:justify-self-start",
		content: "",
		dialog: [
			"fixed inset-0 m-0 size-full max-h-none max-w-none overflow-hidden border-0 bg-transparent p-3.5",
			"backdrop:bg-primary/40 open:grid open:place-items-center",
		],
		header: "mb-2.5",
		surface: [
			"relative z-10 max-h-full max-w-full overflow-y-auto rounded-lg bg-surface p-7 text-text shadow-lg",
		],
		title: "font-serif text-xl font-normal leading-tight",
	},
	variants: {
		hasCloseButton: {
			false: {},
			true: {
				header: "flex items-start justify-between gap-4",
			},
		},
		isFullScreenOnMobile: {
			false: {},
			true: {
				content: [
					"min-h-0 flex-1 overflow-y-auto px-5.5 pb-5.5 pt-4",
					"desktop:px-6.5 desktop:pb-6.5",
					"max-tablet:px-4 max-tablet:pb-4 max-tablet:pt-4",
				],
				dialog: "max-tablet:p-0",
				header: [
					"mb-0 flex shrink-0 items-start px-5.5 pt-5 tablet:justify-between",
					"desktop:px-6.5 desktop:pt-5.5",
					"max-tablet:grid max-tablet:h-14 max-tablet:grid-cols-[2rem_1fr_2rem]",
					"max-tablet:items-center max-tablet:justify-normal max-tablet:gap-0",
					"max-tablet:border-b max-tablet:border-border max-tablet:px-3.5 max-tablet:pt-0",
				],
				surface: [
					"flex flex-col overflow-hidden p-0",
					"max-tablet:h-dvh max-tablet:w-full max-tablet:max-w-none",
					"max-tablet:rounded-none max-tablet:shadow-none",
				],
				title: [
					"max-tablet:col-start-2 max-tablet:row-start-1",
					"max-tablet:text-center max-tablet:font-sans",
					"max-tablet:text-control max-tablet:font-medium",
				],
			},
		},
		size: {
			large: {
				surface: "w-full tablet:w-120 desktop:w-150",
			},
			small: {
				surface: "w-100",
			},
		},
	},
});

type Properties = VariantProps<typeof modalStyles> & {
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	isOpen: boolean;
	onClose: () => void;
	title: string;
};

const Modal = ({
	children,
	className,
	contentClassName,
	hasCloseButton = false,
	isFullScreenOnMobile = false,
	isOpen,
	onClose,
	size = "small",
	title,
}: Properties): JSX.Element => {
	const dialogReference = useRef<HTMLDialogElement>(null);
	const titleId = useId();

	const {
		closeButton,
		content,
		dialog,
		header,
		surface,
		title: titleStyles,
	} = modalStyles({
		hasCloseButton,
		isFullScreenOnMobile,
		size,
	});

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
			className={dialog()}
			onCancel={handleCancel}
			ref={dialogReference}
		>
			<div
				aria-hidden="true"
				className="absolute inset-0 z-0"
				onClick={onClose}
				role="presentation"
			/>
			<div className={surface({ className })}>
				<div className={header()}>
					<h2 className={titleStyles()} id={titleId}>
						{title}
					</h2>

					{hasCloseButton && (
						<Button
							aria-label="Close modal"
							className={closeButton()}
							onClick={onClose}
							variant="ghost"
						>
							<Icon name="close" />
						</Button>
					)}
				</div>

				<div className={content({ className: contentClassName })}>
					{children}
				</div>
			</div>
		</dialog>
	);
};

export { Modal };
