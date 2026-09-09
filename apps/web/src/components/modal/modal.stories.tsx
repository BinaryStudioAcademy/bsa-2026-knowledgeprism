import type { Meta, StoryObj } from "@storybook/react";

import {
	expect,
	fireEvent,
	fn,
	userEvent,
	waitFor,
	within,
} from "@storybook/test";
import { type ComponentProps, type JSX, useCallback } from "react";

import { useModal } from "~/hooks/hooks.js";

import { Button } from "../button/button.js";
import { Modal } from "./modal.js";

type Properties = ComponentProps<typeof Modal>;

const CLOSE_CALLS_AFTER_BACKDROP = 3;
const CLOSE_CALLS_AFTER_CANCEL = 2;
const CLOSE_CALLS_AFTER_CLOSE_BUTTON = 1;
const CLOSE_CALLS_AFTER_ESCAPE = 1;

const ModalPreview = ({
	children,
	isOpen: isInitiallyOpen,
	onClose,
	...properties
}: Properties): JSX.Element => {
	const { hideModal, isOpen, showModal } = useModal(isInitiallyOpen);

	const handleClose = useCallback((): void => {
		onClose();
		hideModal();
	}, [hideModal, onClose]);

	return (
		<div className="min-h-96 p-8">
			<Button onClick={showModal} variant="primary">
				Open modal
			</Button>

			<Modal {...properties} isOpen={isOpen} onClose={handleClose}>
				{children}

				<div className="mt-5.5 flex justify-end gap-2.5">
					<Button onClick={handleClose} variant="ghost">
						Cancel
					</Button>

					<Button onClick={handleClose} variant="destructive">
						Delete
					</Button>
				</div>
			</Modal>
		</div>
	);
};

const meta = {
	args: {
		children: (
			<p className="text-sm leading-[1.55] text-text-muted">
				This can&apos;t be undone. The block will be removed from the document.
			</p>
		),
		hasCloseButton: false,
		isFullScreenOnMobile: false,
		isOpen: false,
		onClose: fn(),
		size: "small",
		title: "Delete this block?",
	},
	component: Modal,
	render: ModalPreview,
	title: "Components/Overlay/Modal",
} satisfies Meta<typeof Modal>;

type Story = StoryObj<typeof meta>;

const CloseButtonInteraction: Story = {
	args: {
		hasCloseButton: true,
		isOpen: false,
		onClose: fn(),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const openModalButton = canvas.getByRole("button", {
			name: "Open modal",
		});

		await userEvent.click(openModalButton);

		const dialog = await canvas.findByRole("dialog", {
			name: "Delete this block?",
		});
		const modal = within(dialog);
		const closeButton = modal.getByRole("button", {
			name: "Close modal",
		});

		await expect(closeButton).toBeVisible();
		await userEvent.click(closeButton);

		await waitFor(() => expect(dialog).not.toBeVisible());
		await expect(args.onClose).toHaveBeenCalledTimes(
			CLOSE_CALLS_AFTER_CLOSE_BUTTON,
		);
		await expect(openModalButton).toHaveFocus();
	},
};

const Default: Story = {};

const FullScreenOnMobile: Story = {
	args: {
		children: (
			<p className="text-sm leading-[1.55] text-text-muted">
				The modal fills the mobile viewport and returns to a centered dialog
				from the tablet breakpoint.
			</p>
		),
		hasCloseButton: true,
		isFullScreenOnMobile: true,
		isOpen: true,
		size: "large",
		title: "Responsive modal",
	},
	parameters: {
		viewport: {
			defaultViewport: "modal-mobile",
			viewports: {
				"modal-mobile": {
					name: "Mobile 390 × 844",
					styles: {
						height: "844px",
						width: "390px",
					},
				},
			},
		},
	},
};

const InteractionTest: Story = {
	args: {
		isOpen: false,
		onClose: fn(),
	},
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const documentBody = canvasElement.ownerDocument.body;
		const previousBodyOverflow = getComputedStyle(documentBody).overflow;
		const openModalButton = canvas.getByRole("button", {
			name: "Open modal",
		});

		await userEvent.click(openModalButton);

		const dialog = await canvas.findByRole("dialog", {
			name: "Delete this block?",
		});
		const modal = within(dialog);
		const cancelButton = modal.getByRole("button", {
			name: "Cancel",
		});
		const confirmButton = modal.getByRole("button", {
			name: "Delete",
		});
		const description = modal.getByText(
			"This can't be undone. The block will be removed from the document.",
		);

		await expect(dialog).toBeVisible();
		await expect(
			modal.queryByRole("button", {
				name: "Close modal",
			}),
		).not.toBeInTheDocument();
		await expect(getComputedStyle(documentBody).overflow).toBe("hidden");
		await waitFor(() => expect(cancelButton).toHaveFocus());

		await userEvent.tab();
		await expect(confirmButton).toHaveFocus();

		await userEvent.click(description);
		await expect(dialog).toBeVisible();
		await expect(args.onClose).not.toHaveBeenCalled();

		await fireEvent(
			dialog,
			new Event("cancel", {
				cancelable: true,
			}),
		);

		await waitFor(() => expect(dialog).not.toBeVisible());
		await expect(args.onClose).toHaveBeenCalledTimes(CLOSE_CALLS_AFTER_ESCAPE);
		await expect(getComputedStyle(documentBody).overflow).toBe(
			previousBodyOverflow,
		);
		await expect(openModalButton).toHaveFocus();

		await userEvent.click(openModalButton);
		await waitFor(() => expect(dialog).toBeVisible());

		await userEvent.click(cancelButton);

		await waitFor(() => expect(dialog).not.toBeVisible());
		await expect(args.onClose).toHaveBeenCalledTimes(CLOSE_CALLS_AFTER_CANCEL);
		await expect(getComputedStyle(documentBody).overflow).toBe(
			previousBodyOverflow,
		);
		await expect(openModalButton).toHaveFocus();

		await userEvent.click(openModalButton);
		await waitFor(() => expect(dialog).toBeVisible());

		const backdrop = dialog.firstElementChild;

		if (!backdrop) {
			throw new Error("Modal backdrop was not rendered.");
		}

		await fireEvent.click(backdrop);

		await waitFor(() => expect(dialog).not.toBeVisible());
		await expect(args.onClose).toHaveBeenCalledTimes(
			CLOSE_CALLS_AFTER_BACKDROP,
		);
		await expect(getComputedStyle(documentBody).overflow).toBe(
			previousBodyOverflow,
		);
		await expect(openModalButton).toHaveFocus();
	},
};

const Large: Story = {
	args: {
		children: (
			<p className="text-sm leading-[1.55] text-text-muted">
				A larger modal surface for workflows that need more space.
			</p>
		),
		isOpen: true,
		size: "large",
		title: "Large modal",
	},
};

const Open: Story = {
	args: {
		isOpen: true,
	},
};

const WithCloseButton: Story = {
	args: {
		hasCloseButton: true,
		isOpen: true,
	},
};

export default meta;
export {
	CloseButtonInteraction,
	Default,
	FullScreenOnMobile,
	InteractionTest,
	Large,
	Open,
	WithCloseButton,
};
