import {
	type Block,
	type BlockSchemaFromSpecs,
	type BlockSpecs,
} from "@blocknote/core";
import { flattenContentToText } from "@knowledgeprism/config";
import { GlossaryValidationRule } from "@knowledgeprism/constants";
import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAppDispatch, useCurrentProjectId } from "~/hooks/hooks.js";
import { useDebouncedValue } from "~/hooks/use-debounced-value/use-debounced-value.hook.js";
import { toGlossaryHighlightId } from "~/modules/glossary/libs/helpers/helpers.js";
import { actions } from "~/modules/knowledge/knowledge.js";
import { GLOSSARY_CHECK_DEBOUNCE_MS } from "~/modules/knowledge/libs/constants/constants.js";

import {
	assignGlossaryMatchesToTexts,
	batchGlossaryCheckTexts,
} from "../helpers/helpers.js";

type EditorBlock = Block<BlockSchemaFromSpecs<BlockSpecs>>;

const EMPTY_LENGTH = 0;
const INITIAL_CACHE_VERSION = 0;
const NO_CHECKS_IN_FLIGHT = 0;
const COUNTER_STEP = 1;
const EMPTY_MATCHES: GlossaryConsistencyMatchDto[] = [];
const BLOCK_TEXT_JOIN_SEPARATOR = "\u{0}";
const BATCH_JOIN_SEPARATOR = "\n\n";

const glossaryEditorCheckCache = new Map<
	string,
	GlossaryConsistencyMatchDto[]
>();

const getTopLevelBlockTexts = (blocks: readonly EditorBlock[]): string[] =>
	blocks
		.map((block) => flattenContentToText([block]))
		.filter((text) => text.trim() !== "");

const useGlossaryEditorWarnings = ({
	blocks,
}: {
	blocks: EditorBlock[];
}): {
	dismiss: (highlightId: string) => void;
	isChecking: boolean;
	matches: GlossaryConsistencyMatchDto[];
} => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
	const [isChecking, setIsChecking] = useState(false);
	const [cacheVersion, setCacheVersion] = useState(INITIAL_CACHE_VERSION);
	const inFlightChecksReference = useRef(NO_CHECKS_IN_FLIGHT);

	const blockTexts = useMemo(() => getTopLevelBlockTexts(blocks), [blocks]);
	const blockTextsKey = blockTexts.join(BLOCK_TEXT_JOIN_SEPARATOR);
	const debouncedBlockTextsKey = useDebouncedValue(
		blockTextsKey,
		GLOSSARY_CHECK_DEBOUNCE_MS,
	);

	useEffect(() => {
		const debouncedBlockTexts =
			debouncedBlockTextsKey === ""
				? []
				: debouncedBlockTextsKey.split(BLOCK_TEXT_JOIN_SEPARATOR);
		const uncachedTexts = [...new Set(debouncedBlockTexts)].filter(
			(text) => !glossaryEditorCheckCache.has(text),
		);

		if (uncachedTexts.length === EMPTY_LENGTH) {
			return;
		}

		const batches = batchGlossaryCheckTexts(
			uncachedTexts,
			GlossaryValidationRule.CONTENT_MAXIMUM_LENGTH,
			BATCH_JOIN_SEPARATOR,
		);
		const batchedTexts = new Set(batches.flat());

		for (const text of uncachedTexts) {
			if (!batchedTexts.has(text)) {
				glossaryEditorCheckCache.set(text, EMPTY_MATCHES);
			}
		}

		if (batches.length === EMPTY_LENGTH) {
			setCacheVersion((version) => version + COUNTER_STEP);
			return;
		}

		const runGlossaryChecks = async (): Promise<void> => {
			inFlightChecksReference.current += COUNTER_STEP;
			setIsChecking(true);

			try {
				await Promise.all(
					batches.map(async (batchTexts) => {
						try {
							const response = await dispatch(
								actions.checkGlossaryConsistency({
									content: batchTexts.join(BATCH_JOIN_SEPARATOR),
									projectId,
								}),
							).unwrap();
							const assignedMatches = assignGlossaryMatchesToTexts(
								batchTexts,
								response.matches,
							);

							for (const text of batchTexts) {
								glossaryEditorCheckCache.set(
									text,
									assignedMatches.get(text) ?? EMPTY_MATCHES,
								);
							}
						} catch {
							for (const text of batchTexts) {
								glossaryEditorCheckCache.set(text, EMPTY_MATCHES);
							}
						}
					}),
				);
			} finally {
				inFlightChecksReference.current -= COUNTER_STEP;
				setCacheVersion((version) => version + COUNTER_STEP);
				setIsChecking(inFlightChecksReference.current > NO_CHECKS_IN_FLIGHT);
			}
		};

		void runGlossaryChecks();
	}, [debouncedBlockTextsKey, dispatch, projectId]);

	const matches = useMemo(() => {
		const matchById = new Map<string, GlossaryConsistencyMatchDto>();

		for (const text of blockTexts) {
			const cachedMatches = glossaryEditorCheckCache.get(text) ?? EMPTY_MATCHES;

			for (const match of cachedMatches) {
				const highlightId = toGlossaryHighlightId(match);

				if (!dismissedIds.has(highlightId)) {
					matchById.set(highlightId, match);
				}
			}
		}

		return matchById.values().toArray();
	}, [blockTexts, cacheVersion, dismissedIds]);

	const dismiss = useCallback((highlightId: string): void => {
		setDismissedIds((previous) => new Set(previous).add(highlightId));
	}, []);

	return { dismiss, isChecking, matches };
};

export { useGlossaryEditorWarnings };
