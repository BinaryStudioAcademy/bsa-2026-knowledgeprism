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
		isOpen: false,
		onClose: fn(),
		title: "Delete this block?",
	},
	component: Modal,
	render: ModalPreview,
	title: "Components/Overlay/Modal",
} satisfies Meta<typeof Modal>;

type Story = StoryObj<typeof meta>;

const Default: Story = {};

const Open: Story = {
	args: {
		isOpen: true,
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
		const backdropButton = modal.getByRole("button", {
			name: "Close modal",
		});
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

		await userEvent.click(backdropButton);

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

export default meta;
export { Default, InteractionTest, Open };
