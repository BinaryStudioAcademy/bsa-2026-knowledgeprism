import {
	KnowledgeNodeType,
	ProjectMemberRole,
} from "@knowledgeprism/constants";
import { fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { AppSidebarOverlayContext } from "~/app/layouts/app-sidebar-overlay-context.js";
import { KnowledgeTreePanelProvider } from "~/app/layouts/knowledge-tree-panel-context.js";
import { type ShellSidebar } from "~/components/sidebar/libs/use-shell-sidebar.hook.js";
import { Sidebar } from "~/components/sidebar/sidebar.js";
import { store } from "~/lib/store/store.js";

import { KnowledgeTreeLayout } from "./knowledge-tree-layout.js";

const PROJECT_ID = "project-1";

const shell: ShellSidebar = {
	closeOverlay: vi.fn(),
	dismissOverlay: vi.fn(),
	isExpanded: true,
	isOverlayOpen: false,
	mode: "wide",
	toggleSidebar: vi.fn(),
};

const renderLayout = (): void => {
	render(
		<Provider store={store.instance}>
			<AppSidebarOverlayContext.Provider value={shell}>
				<MemoryRouter
					initialEntries={[`/workspaces/${PROJECT_ID}/knowledge-tree`]}
				>
					<KnowledgeTreePanelProvider>
						<Routes>
							<Route
								element={
									<>
										<Sidebar
											projectName="Project Alpha"
											role={ProjectMemberRole.EDITOR}
											shell={shell}
										/>
										<KnowledgeTreeLayout
											canEdit
											entries={{}}
											items={[
												{
													id: 1,
													parentId: null,
													position: 0,
													title: "Overview",
													type: KnowledgeNodeType.PAGE,
													updatedAt: "2026-09-28T00:00:00.000Z",
												},
											]}
											onSelectPage={vi.fn()}
										/>
									</>
								}
								path="/workspaces/:projectId/knowledge-tree"
							/>
						</Routes>
					</KnowledgeTreePanelProvider>
				</MemoryRouter>
			</AppSidebarOverlayContext.Provider>
		</Provider>,
	);
};

describe("KnowledgeTreeLayout sidebar collapse", () => {
	it("hides the tree from a corner control and opens it from the main sidebar", () => {
		renderLayout();

		expect(
			screen.queryByRole("button", { name: "Expand sidebar" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("button", { name: "Show knowledge tree" }),
		).not.toBeInTheDocument();

		const hideTree = screen.getByRole("button", {
			name: "Hide knowledge tree",
		});
		const treePanel = hideTree.closest("aside");

		expect(hideTree).not.toHaveTextContent("Hide knowledge tree");
		expect(hideTree.querySelector("svg")).not.toBeNull();
		expect(hideTree.className).not.toContain("rounded-full");

		fireEvent.click(hideTree);

		expect(
			screen.queryByRole("button", { name: "Show knowledge tree" }),
		).not.toBeInTheDocument();
		expect(treePanel?.className).toContain("@5xl:hidden");
		expect(treePanel?.className).not.toContain("w-14");
		expect(treePanel?.className).not.toContain("rounded-full");

		fireEvent.click(screen.getByRole("link", { name: "Knowledge Tree" }));

		expect(treePanel?.className).not.toContain("@5xl:hidden");
		expect(
			screen.getByRole("button", { name: "Hide knowledge tree" }),
		).toBeInTheDocument();
		expect(screen.getByText("Overview")).toBeInTheDocument();
	});
});
