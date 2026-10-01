import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { store } from "~/lib/store/store.js";
import { documentsApi } from "~/modules/knowledge/knowledge.js";
import { submitManualText } from "~/modules/knowledge/state/actions.js";
import { actions } from "~/modules/knowledge/state/knowledge.slice.js";

import { AddKnowledgeModal } from "./add-knowledge-modal.js";

const PROJECT_ID = "1";

const renderModal = (): void => {
	const handleClose = vi.fn();

	render(
		<Provider store={store.instance}>
			<MemoryRouter initialEntries={[`/projects/${PROJECT_ID}`]}>
				<Routes>
					<Route
						element={
							<AddKnowledgeModal
								isOpen
								onClose={handleClose}
								projectName="Test Project"
							/>
						}
						path="/projects/:projectId"
					/>
				</Routes>
			</MemoryRouter>
		</Provider>,
	);
};

describe("AddKnowledgeModal tab error isolation", () => {
	beforeEach(() => {
		HTMLDialogElement.prototype.showModal = vi.fn(() => {
			const dialog = document.querySelector("dialog");

			if (dialog) {
				dialog.open = true;
			}
		});
		HTMLDialogElement.prototype.close = vi.fn(() => {
			const dialog = document.querySelector("dialog");

			if (dialog) {
				dialog.open = false;
			}
		});
		store.instance.dispatch(actions.resetState(PROJECT_ID));
	});

	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
		store.instance.dispatch(actions.resetState(null));
	});

	it("does not display upload error on Upload files tab when manual text fails", async () => {
		vi.spyOn(documentsApi, "createManualText").mockRejectedValue(
			new Error("Unexpected token '<', \"<!doctype \"... is not valid JSON"),
		);

		renderModal();

		const uploadSessionId = store.instance.getState().knowledge.uploadSession
			?.id as number;

		await store.instance.dispatch(
			submitManualText({
				payload: { content: "Some manual knowledge", title: "Test Note" },
				projectId: PROJECT_ID,
				uploadSessionId,
			}),
		);

		expect(screen.queryByText(/upload error/i)).not.toBeInTheDocument();
		expect(screen.queryByText(/unexpected token '<'/i)).not.toBeInTheDocument();
		expect(screen.getByText(/drag files here/i)).toBeInTheDocument();
	});
});
