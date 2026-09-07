import type { Meta, StoryObj } from "@storybook/react";

import { expect, fn, userEvent, waitFor, within } from "@storybook/test";

import { ManualTextInput } from "./manual-text-input.js";

const EXPECTED_INITIAL_SUBMISSION_COUNT = 1;
const EXPECTED_RETRY_SUBMISSION_COUNT = 2;
const PROCESSING_DELAY_IN_MILLISECONDS = 300;
const TITLE_MAXIMUM_LENGTH = 255;
const TITLE_OVERFLOW_CHARACTER_COUNT = 1;
const VALID_CONTENT = "Prism should preserve and submit this complete content.";
const VALID_TITLE = "Onboarding notes";
const WHITESPACE_CONTENT_CHARACTER_COUNT = 3;

const getFormElements = (canvasElement: HTMLElement) => {
	const canvas = within(canvasElement);

	return {
		canvas,
		contentInput: canvas.getByRole("textbox", {
			name: "Content",
		}),
		submitButton: canvas.getByRole("button", {
			name: "Add to Knowledge Tree",
		}),
		titleInput: canvas.getByRole("textbox", {
			name: "Title",
		}),
	};
};

const meta = {
	args: {
		isLoading: false,
		onCancel: fn(),
		onSubmit: fn(),
	},
	component: ManualTextInput,
	decorators: [
		(Story) => (
			<div className="min-h-screen bg-bg p-8">
				<div className="mx-auto max-w-2xl overflow-hidden rounded-lg bg-surface shadow-lg">
					<Story />
				</div>
			</div>
		),
	],
	title: "Features/Knowledge/Manual Text Input",
} satisfies Meta<typeof ManualTextInput>;

type Story = StoryObj<typeof meta>;

const Default: Story = {};

const Loading: Story = {
	args: {
		isLoading: true,
	},
};

const ProcessingFailure: Story = {
	args: {
		onSubmit: fn(() =>
			Promise.reject(new Error("Simulated processing failure")),
		),
	},
	play: async ({ args, canvasElement }) => {
		const { canvas, contentInput, submitButton, titleInput } =
			getFormElements(canvasElement);

		await userEvent.type(titleInput, VALID_TITLE);
		await userEvent.type(contentInput, VALID_CONTENT);
		await userEvent.click(submitButton);

		const failureAlert = await canvas.findByRole("alert");
		const retryButton = canvas.getByRole("button", {
			name: "Retry",
		});
		const cancelButton = canvas.getByRole("button", {
			name: "Cancel",
		});

		await expect(failureAlert).toHaveTextContent("Processing failed");
		await expect(contentInput).toHaveValue(VALID_CONTENT);
		await expect(titleInput).toHaveValue(VALID_TITLE);
		await expect(retryButton).toBeEnabled();
		await expect(cancelButton).toBeEnabled();
		await expect(args.onSubmit).toHaveBeenCalledTimes(
			EXPECTED_INITIAL_SUBMISSION_COUNT,
		);

		await userEvent.click(retryButton);

		await waitFor(() =>
			expect(args.onSubmit).toHaveBeenCalledTimes(
				EXPECTED_RETRY_SUBMISSION_COUNT,
			),
		);
	},
};

const RepeatedSubmission: Story = {
	args: {
		onSubmit: fn(
			() =>
				new Promise<void>((resolve) => {
					setTimeout(resolve, PROCESSING_DELAY_IN_MILLISECONDS);
				}),
		),
	},
	play: async ({ args, canvasElement }) => {
		const { contentInput, submitButton, titleInput } =
			getFormElements(canvasElement);

		await userEvent.type(titleInput, VALID_TITLE);
		await userEvent.type(contentInput, VALID_CONTENT);
		await userEvent.dblClick(submitButton);

		await waitFor(() => expect(submitButton).toBeEnabled());
		await expect(args.onSubmit).toHaveBeenCalledTimes(
			EXPECTED_INITIAL_SUBMISSION_COUNT,
		);
	},
};

const SuccessfulSubmission: Story = {
	args: {
		onSubmit: fn(),
	},
	play: async ({ args, canvasElement }) => {
		const { contentInput, submitButton, titleInput } =
			getFormElements(canvasElement);

		await userEvent.type(titleInput, VALID_TITLE);
		await userEvent.type(contentInput, VALID_CONTENT);
		await userEvent.click(submitButton);

		await waitFor(() =>
			expect(args.onSubmit).toHaveBeenCalledTimes(
				EXPECTED_INITIAL_SUBMISSION_COUNT,
			),
		);
		await expect(args.onSubmit).toHaveBeenLastCalledWith({
			content: VALID_CONTENT,
			title: VALID_TITLE,
		});
	},
};

const Validation: Story = {
	play: async ({ canvasElement }) => {
		const { canvas, contentInput, submitButton, titleInput } =
			getFormElements(canvasElement);

		await userEvent.type(
			contentInput,
			" ".repeat(WHITESPACE_CONTENT_CHARACTER_COUNT),
		);
		await userEvent.tab();

		await expect(await canvas.findByText("Content is required")).toBeVisible();
		await expect(submitButton).toBeDisabled();

		await userEvent.clear(contentInput);
		await userEvent.type(contentInput, VALID_CONTENT);
		await userEvent.type(
			titleInput,
			"a".repeat(TITLE_MAXIMUM_LENGTH + TITLE_OVERFLOW_CHARACTER_COUNT),
		);
		await userEvent.tab();

		await expect(
			await canvas.findByText(
				`Title must be at most ${TITLE_MAXIMUM_LENGTH.toString()} characters long`,
			),
		).toBeVisible();
		await expect(submitButton).toBeDisabled();
	},
};

export default meta;
export {
	Default,
	Loading,
	ProcessingFailure,
	RepeatedSubmission,
	SuccessfulSubmission,
	Validation,
};
