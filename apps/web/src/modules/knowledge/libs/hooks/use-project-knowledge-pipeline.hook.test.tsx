import { KnowledgeNodeType } from "@knowledgeprism/constants";
import { type KnowledgeTreeResponseDto } from "@knowledgeprism/types";
import { act, render, waitFor } from "@testing-library/react";
import { type JSX, useEffect } from "react";
import { Provider } from "react-redux";
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	type MockInstance,
	vi,
} from "vitest";

import { useAppDispatch, useAppSelector } from "~/hooks/hooks.js";
import { store } from "~/lib/store/store.js";

import { documentsApi, knowledgeApi } from "../../knowledge.js";
import { actions } from "../../state/state.js";
import { useProjectKnowledgePipeline } from "./use-project-knowledge-pipeline.hook.js";

const PROJECT_ID = "project-a";
const SECOND_PROJECT_ID = "project-b";
const KNOWLEDGE_NODE_ID = 1;
const SECOND_KNOWLEDGE_NODE_ID = 2;

const createDeferred = <Value,>(): PromiseWithResolvers<Value> =>
	Promise.withResolvers<Value>();

const createTree = (
	id = KNOWLEDGE_NODE_ID,
	title = "Project overview",
): KnowledgeTreeResponseDto => ({
	items: [
		{
			id,
			parentId: null,
			position: 0,
			title,
			type: KnowledgeNodeType.PAGE,
			updatedAt: "2026-09-28T00:00:00.000Z",
		},
	],
});

const TreeRequest = ({ projectId }: { projectId: string }): null => {
	const dispatch = useAppDispatch();
	const pipelineProjectId = useAppSelector(
		({ knowledge }) => knowledge.pipelineProjectId,
	);

	useEffect(() => {
		if (pipelineProjectId !== projectId) {
			return;
		}

		const request = dispatch(actions.fetchKnowledgeTree({ projectId }));

		return () => {
			request.abort();
		};
	}, [dispatch, pipelineProjectId, projectId]);

	return null;
};

const ProjectKnowledgeScope = ({
	canEdit = true,
	projectId,
}: {
	canEdit?: boolean;
	projectId: string;
}): JSX.Element => {
	useProjectKnowledgePipeline({ canEdit, projectId });

	return <TreeRequest projectId={projectId} />;
};

describe("project knowledge initialization", () => {
	let pendingReviewDocumentsSpy: MockInstance;

	beforeEach(() => {
		store.instance.dispatch(actions.resetState(null));
		pendingReviewDocumentsSpy = vi
			.spyOn(documentsApi, "getPendingReviewDocuments")
			.mockResolvedValue({ items: [] });
	});

	afterEach(() => {
		store.instance.dispatch(actions.resetState(null));
		vi.restoreAllMocks();
	});

	it.each([
		["empty", { items: [] }],
		["non-empty", createTree()],
	])(
		"loads the %s project on the first visit",
		async (_scenario, treeResponse: KnowledgeTreeResponseDto) => {
			const treeRequest = createDeferred<KnowledgeTreeResponseDto>();
			const getKnowledgeTree = vi
				.spyOn(knowledgeApi, "getKnowledgeTree")
				.mockReturnValue(treeRequest.promise);

			render(
				<Provider store={store.instance}>
					<ProjectKnowledgeScope projectId={PROJECT_ID} />
				</Provider>,
			);

			await waitFor(() => {
				expect(getKnowledgeTree).toHaveBeenCalledOnce();
			});

			await act(async () => {
				treeRequest.resolve(treeResponse);
				await treeRequest.promise;
			});

			await waitFor(() => {
				const knowledgeState = store.instance.getState().knowledge;

				expect(knowledgeState.isTreeLoading).toBe(false);
				expect(knowledgeState.tree).toEqual(treeResponse.items);
			});
		},
	);

	it("loads the latest project when switching during an in-flight request", async () => {
		const firstTreeRequest = createDeferred<KnowledgeTreeResponseDto>();
		const secondTreeRequest = createDeferred<KnowledgeTreeResponseDto>();
		const getKnowledgeTree = vi
			.spyOn(knowledgeApi, "getKnowledgeTree")
			.mockImplementation(({ projectId }) =>
				projectId === PROJECT_ID
					? firstTreeRequest.promise
					: secondTreeRequest.promise,
			);
		const view = render(
			<Provider store={store.instance}>
				<ProjectKnowledgeScope projectId={PROJECT_ID} />
			</Provider>,
		);

		await waitFor(() => {
			expect(getKnowledgeTree).toHaveBeenCalledWith(
				expect.objectContaining({ projectId: PROJECT_ID }),
			);
		});

		view.rerender(
			<Provider store={store.instance}>
				<ProjectKnowledgeScope projectId={SECOND_PROJECT_ID} />
			</Provider>,
		);

		await waitFor(() => {
			expect(getKnowledgeTree).toHaveBeenCalledWith(
				expect.objectContaining({ projectId: SECOND_PROJECT_ID }),
			);
		});

		const secondTree = createTree(
			SECOND_KNOWLEDGE_NODE_ID,
			"Second project overview",
		);

		await act(async () => {
			secondTreeRequest.resolve(secondTree);
			await secondTreeRequest.promise;
		});

		await waitFor(() => {
			const knowledgeState = store.instance.getState().knowledge;

			expect(knowledgeState.isTreeLoading).toBe(false);
			expect(knowledgeState.tree).toEqual(secondTree.items);
		});

		firstTreeRequest.resolve(createTree());
	});

	it("keeps the tree when project write access becomes available", async () => {
		const treeResponse = createTree();
		const getKnowledgeTree = vi
			.spyOn(knowledgeApi, "getKnowledgeTree")
			.mockResolvedValue(treeResponse);
		const view = render(
			<Provider store={store.instance}>
				<ProjectKnowledgeScope canEdit={false} projectId={PROJECT_ID} />
			</Provider>,
		);

		await waitFor(() => {
			expect(store.instance.getState().knowledge.tree).toEqual(
				treeResponse.items,
			);
		});

		const initialRequestCount = getKnowledgeTree.mock.calls.length;

		view.rerender(
			<Provider store={store.instance}>
				<ProjectKnowledgeScope projectId={PROJECT_ID} />
			</Provider>,
		);

		await waitFor(() => {
			expect(pendingReviewDocumentsSpy).toHaveBeenCalledWith(
				expect.objectContaining({ projectId: PROJECT_ID }),
			);
		});

		const knowledgeState = store.instance.getState().knowledge;

		expect(getKnowledgeTree).toHaveBeenCalledTimes(initialRequestCount);
		expect(knowledgeState.isTreeLoading).toBe(false);
		expect(knowledgeState.tree).toEqual(treeResponse.items);
	});
});
