import {
	type Block,
	type BlockSchemaFromSpecs,
	type BlockSpecs,
} from "@blocknote/core";
import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGlossaryEditorWarnings } from "./use-glossary-editor-warnings.hook.js";

type CheckPayload = { content: string; projectId: string };

type EditorBlock = Block<BlockSchemaFromSpecs<BlockSpecs>>;

const mocks = vi.hoisted(() => {
	const checkConsistency = vi.fn();

	return {
		checkConsistency,
		dispatch: (payload: CheckPayload): { unwrap: () => Promise<unknown> } => ({
			unwrap: () => checkConsistency(payload) as Promise<unknown>,
		}),
		projectId: { current: "project-a" },
	};
});

vi.mock("~/hooks/hooks.js", () => ({
	useAppDispatch: () => mocks.dispatch,
	useCurrentProjectId: () => mocks.projectId.current,
}));

vi.mock("~/hooks/use-debounced-value/use-debounced-value.hook.js", () => ({
	useDebouncedValue: <T>(value: T): T => value,
}));

vi.mock("~/modules/knowledge/knowledge.js", () => ({
	actions: {
		checkGlossaryConsistency: (payload: CheckPayload): CheckPayload => payload,
	},
}));

const createMatch = (matchedTermId: number): GlossaryConsistencyMatchDto => ({
	canonicalName: "API",
	explanation: "Spells out the canonical term instead of using it.",
	matchedTermId,
	sourceExcerpt: "application programming interface",
	suggestedText: "API",
});

const createBlocks = (text: string): EditorBlock[] =>
	[
		{
			children: [],
			content: [{ styles: {}, text, type: "text" }],
			id: "block-1",
			props: {},
			type: "paragraph",
		},
	] as unknown as EditorBlock[];

const PROJECT_A_TERM_ID = 1;
const PROJECT_B_TERM_ID = 2;
const EXPECTED_CHECKS_AFTER_PROJECT_SWITCH = 2;
const EXPECTED_CHECKS_AFTER_RETRY = 2;

const PROJECT_A_MATCH = createMatch(PROJECT_A_TERM_ID);
const PROJECT_B_MATCH = createMatch(PROJECT_B_TERM_ID);

describe("useGlossaryEditorWarnings", () => {
	beforeEach(() => {
		mocks.checkConsistency.mockReset();
		mocks.checkConsistency.mockImplementation(({ projectId }: CheckPayload) =>
			Promise.resolve({
				matches: [
					projectId === "project-a" ? PROJECT_A_MATCH : PROJECT_B_MATCH,
				],
			}),
		);
	});

	it("does not reuse another project's warnings for the same paragraph", async () => {
		const blocks = createBlocks(
			"Switch projects with the application programming interface.",
		);

		mocks.projectId.current = "project-a";
		const first = renderHook(() => useGlossaryEditorWarnings({ blocks }));
		await waitFor(() => {
			expect(first.result.current.matches).toStrictEqual([PROJECT_A_MATCH]);
		});
		first.unmount();

		mocks.projectId.current = "project-b";
		const second = renderHook(() => useGlossaryEditorWarnings({ blocks }));
		await waitFor(() => {
			expect(second.result.current.matches).toStrictEqual([PROJECT_B_MATCH]);
		});

		expect(mocks.checkConsistency).toHaveBeenCalledTimes(
			EXPECTED_CHECKS_AFTER_PROJECT_SWITCH,
		);
	});

	it("checks a paragraph again after a failed check", async () => {
		const blocks = createBlocks(
			"Retry the application programming interface check.",
		);

		mocks.projectId.current = "project-a";
		mocks.checkConsistency.mockRejectedValueOnce(new Error("Network error"));
		const first = renderHook(() => useGlossaryEditorWarnings({ blocks }));
		await waitFor(() => {
			expect(mocks.checkConsistency).toHaveBeenCalledOnce();
			expect(first.result.current.isChecking).toBe(false);
		});
		expect(first.result.current.matches).toStrictEqual([]);
		first.unmount();

		const second = renderHook(() => useGlossaryEditorWarnings({ blocks }));
		await waitFor(() => {
			expect(second.result.current.matches).toStrictEqual([PROJECT_A_MATCH]);
		});

		expect(mocks.checkConsistency).toHaveBeenCalledTimes(
			EXPECTED_CHECKS_AFTER_RETRY,
		);
	});
});
