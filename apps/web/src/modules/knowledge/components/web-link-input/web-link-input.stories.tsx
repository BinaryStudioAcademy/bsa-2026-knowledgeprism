import type { Meta, StoryObj } from "@storybook/react";

import { expect, fn, userEvent, waitFor, within } from "@storybook/test";

import { WebLinkInput } from "./web-link-input.js";

const EXPECTED_SUBMISSION_COUNT = 1;
const INDEXING_TIMEOUT_MS = 2000;
const VALID_URL = "https://example.com/docs/api-reference";

const meta = {
	args: {
		onCancel: fn(),
		onSubmit: fn(),
	},
	component: WebLinkInput,
	decorators: [
		(Story) => (
			<div className="min-h-screen bg-bg p-8">
				<div className="mx-auto max-w-2xl overflow-hidden rounded-lg bg-surface p-7 shadow-lg">
					<Story />
				</div>
			</div>
		),
	],
	title: "Features/Knowledge/Web Link Input",
} satisfies Meta<typeof WebLinkInput>;

type Story = StoryObj<typeof meta>;

const Default: Story = {};

const InvalidUrl: Story = {
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const urlInput = canvas.getByRole("textbox", {
			name: "Web page URL",
		});

		await userEvent.type(urlInput, "invalid-url");
		await userEvent.click(
			canvas.getByRole("button", {
				name: "Fetch",
			}),
		);

		await expect(
			canvas.getByText("Enter a valid HTTP or HTTPS URL"),
		).toBeVisible();
	},
};

const SuccessfulFetch: Story = {
	play: async ({ args, canvasElement }) => {
		const canvas = within(canvasElement);
		const urlInput = canvas.getByRole("textbox", {
			name: "Web page URL",
		});

		await userEvent.type(urlInput, VALID_URL);
		await userEvent.click(
			canvas.getByRole("button", {
				name: "Fetch",
			}),
		);

		await expect(canvas.getByText("Fetching…")).toBeVisible();

		await waitFor(() => expect(canvas.getByText("Indexed")).toBeVisible(), {
			timeout: INDEXING_TIMEOUT_MS,
		});

		await userEvent.click(
			canvas.getByRole("button", {
				name: "Add to Knowledge Tree",
			}),
		);

		await expect(args.onSubmit).toHaveBeenCalledTimes(
			EXPECTED_SUBMISSION_COUNT,
		);
	},
};

export default meta;
export { Default, InvalidUrl, SuccessfulFetch };
