import type { Meta, StoryObj } from "@storybook/react";

import { fn } from "@storybook/test";

import { KbEntryDetail } from "./kb-entry-detail.js";

const TIMEOUT_DELAY_MS = 300;
const INITIAL_VERSION = 1;
const SERVER_VERSION = 2;
const HTTP_STATUS_CONFLICT = 409;
const HTTP_STATUS_LOCKED = 423;

const BASE_CONTENT = "Rule 1: Password must contain at least 8 characters.";

const BASE_ENTRY = {
	content: BASE_CONTENT,
	id: "mock-entry-id",
	title: "Password Validation",
	version: INITIAL_VERSION,
};

const meta: Meta<typeof KbEntryDetail> = {
	args: {
		canEdit: true,
		onSave: fn(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, TIMEOUT_DELAY_MS);
			});
		}),
	},
	component: KbEntryDetail,
	title: "Features/Knowledge/KbEntryDetail",
};

type Story = StoryObj<typeof KbEntryDetail>;

const Default: Story = {
	args: {
		canEdit: true,
		entry: BASE_ENTRY,
	},
};

const ViewerMode: Story = {
	args: {
		canEdit: false,
		entry: BASE_ENTRY,
	},
};

const VersionConflict: Story = {
	args: {
		canEdit: true,
		entry: BASE_ENTRY,
		onSave: fn(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, TIMEOUT_DELAY_MS);
			});

			const conflictError = Object.assign(
				new Error("Version conflict on server"),
				{
					serverEntry: {
						content:
							"Rule 1: 8 characters.\nRule 2: At least one digit (from User 1).",
						id: "mock-entry-id",
						title: "Password Validation (Server v2 by User 1)",
						version: SERVER_VERSION,
					},
					status: HTTP_STATUS_CONFLICT,
				},
			);

			throw conflictError;
		}),
	},
};

const AiLockedState: Story = {
	args: {
		canEdit: true,
		entry: BASE_ENTRY,
		onSave: fn(async () => {
			await new Promise((resolve) => {
				setTimeout(resolve, TIMEOUT_DELAY_MS);
			});

			const lockedError = Object.assign(new Error("Resource is locked by AI"), {
				message: "Locked: AI is currently drafting an update for this page",
				status: HTTP_STATUS_LOCKED,
			});

			throw lockedError;
		}),
	},
};

export default meta;
export { AiLockedState, Default, VersionConflict, ViewerMode };
