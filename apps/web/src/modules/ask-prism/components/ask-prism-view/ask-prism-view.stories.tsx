import type { Meta, StoryObj } from "@storybook/react";

import { BrowserRouter } from "react-router-dom";

import { StoreProvider } from "~/components/components.js";
import { store } from "~/lib/store/store.js";

import { AskPrismView } from "./ask-prism-view.js";

const meta = {
	component: AskPrismView,
	decorators: [
		(Story) => (
			<StoreProvider store={store.instance}>
				<BrowserRouter>
					<div className="w-full max-w-4xl p-6">
						<Story />
					</div>
				</BrowserRouter>
			</StoreProvider>
		),
	],
	parameters: {
		layout: "centered",
	},
	title: "Modules/AskPrism/AskPrismView",
} satisfies Meta<typeof AskPrismView>;

type Story = StoryObj<typeof meta>;

const Default: Story = {};

export default meta;
export { Default };
