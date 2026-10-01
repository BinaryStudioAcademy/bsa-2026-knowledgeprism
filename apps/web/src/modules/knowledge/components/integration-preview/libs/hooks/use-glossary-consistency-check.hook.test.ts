import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useGlossaryConsistencyCheck } from "./use-glossary-consistency-check.hook.js";

type CheckPayload = { content: string; projectId: string };

const mocks = vi.hoisted(() => {
	const checkConsistency = vi.fn();

	return {
		checkConsistency,
		dispatch: (payload: CheckPayload): { unwrap: () => Promise<unknown> } => ({
			unwrap: () => checkConsistency(payload) as Promise<unknown>,
		}),
		projectId: { current: "project-a" },
		revision: { current: 0 },
	};
});

vi.mock("~/hooks/hooks.js", () => ({
	useAppDispatch: () => mocks.dispatch,
	useAppSelector: <T>(
		selector: (state: { glossary: { revision: number } }) => T,
	): T => selector({ glossary: { revision: mocks.revision.current } }),
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

const PROJECT_A_TERM_ID = 1;
const PROJECT_B_TERM_ID = 2;
const EXPECTED_CHECKS_AFTER_PROJECT_SWITCH = 2;

const PROJECT_A_MATCH = createMatch(PROJECT_A_TERM_ID);
const PROJECT_B_MATCH = createMatch(PROJECT_B_TERM_ID);

const SECTION_ID = "101";

const renderCheck = (
	content: string,
): ReturnType<
	typeof renderHook<ReturnType<typeof useGlossaryConsistencyCheck>, unknown>
> =>
	renderHook(() =>
		useGlossaryConsistencyCheck({
			content,
			onContentChange: vi.fn(),
			sectionId: SECTION_ID,
		}),
	);

describe("useGlossaryConsistencyCheck", () => {
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

	it("does not reuse another project's suggestions for the same content", async () => {
		const content =
			"Switch projects with the application programming interface.";

		mocks.projectId.current = "project-a";
		const first = renderCheck(content);
		await waitFor(() => {
			expect(first.result.current.glossaryMatches).toStrictEqual([
				PROJECT_A_MATCH,
			]);
		});
		first.unmount();

		mocks.projectId.current = "project-b";
		const second = renderCheck(content);
		await waitFor(() => {
			expect(second.result.current.glossaryMatches).toStrictEqual([
				PROJECT_B_MATCH,
			]);
		});

		expect(mocks.checkConsistency).toHaveBeenCalledTimes(
			EXPECTED_CHECKS_AFTER_PROJECT_SWITCH,
		);
	});

	it("keeps a dismissed suggestion dismissed after remounting", async () => {
		const content = "Keep the application programming interface.";

		mocks.projectId.current = "project-a";
		const first = renderCheck(content);
		await waitFor(() => {
			expect(first.result.current.glossaryMatches).toStrictEqual([
				PROJECT_A_MATCH,
			]);
		});
		act(() => {
			first.result.current.onKeepGlossarySuggestion(PROJECT_A_MATCH);
		});
		first.unmount();

		const second = renderCheck(content);
		await waitFor(() => {
			expect(second.result.current.isCheckingGlossary).toBe(false);
		});

		expect(second.result.current.glossaryMatches).toStrictEqual([]);
		expect(mocks.checkConsistency).toHaveBeenCalledOnce();
	});
});
