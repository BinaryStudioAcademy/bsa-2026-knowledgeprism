import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { useCallback, useEffect, useState } from "react";

import { useAppDispatch, useCurrentProjectId } from "~/hooks/hooks.js";
import { useDebouncedValue } from "~/hooks/use-debounced-value/use-debounced-value.hook.js";
import { actions } from "~/modules/knowledge/knowledge.js";
import { GLOSSARY_CHECK_DEBOUNCE_MS } from "~/modules/knowledge/libs/constants/constants.js";

type GlossaryCheck = {
	content: string;
	matches: GlossaryConsistencyMatchDto[];
};

const INITIAL_GLOSSARY_CHECK: GlossaryCheck = { content: "", matches: [] };

// Integration Preview remounts a fresh component instance between the extraction-review
// screen and the post-integration preview screen (different `key`s, same content) — without
// this cache, the same content gets re-sent to check-consistency on every remount even though
// nothing changed. Keyed by content, cleared per browser session; never exported/mutated
// outside this module.
const glossaryCheckCache = new Map<string, GlossaryConsistencyMatchDto[]>();

// Scans the proposed content against the project's glossary (Add Knowledge's Integration
// Preview surface, kp-419) and returns suggestions the reviewer can accept, keep, or ignore.
const useGlossaryConsistencyCheck = ({
	content,
	onContentChange,
}: {
	content: string;
	onContentChange: (content: string) => void;
}): {
	glossaryMatches: GlossaryConsistencyMatchDto[];
	isCheckingGlossary: boolean;
	onAcceptGlossarySuggestion: (match: GlossaryConsistencyMatchDto) => void;
	onKeepGlossarySuggestion: (match: GlossaryConsistencyMatchDto) => void;
} => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	// Keyed by the content it was computed for, so the matches shown are always for the
	// currently displayed content, without needing a separate reset call in the effect.
	const [glossaryCheck, setGlossaryCheck] = useState<GlossaryCheck>(
		INITIAL_GLOSSARY_CHECK,
	);
	const [isCheckingGlossary, setIsCheckingGlossary] = useState<boolean>(false);
	const debouncedContent = useDebouncedValue(
		content,
		GLOSSARY_CHECK_DEBOUNCE_MS,
	);
	const glossaryMatches =
		glossaryCheck.content === debouncedContent ? glossaryCheck.matches : [];

	useEffect(() => {
		let isCancelled = false;

		const runGlossaryCheck = async (): Promise<void> => {
			if (!debouncedContent.trim()) {
				setIsCheckingGlossary(false);
				return;
			}

			const cachedMatches = glossaryCheckCache.get(debouncedContent);

			if (cachedMatches) {
				setGlossaryCheck({ content: debouncedContent, matches: cachedMatches });
				return;
			}

			setIsCheckingGlossary(true);

			try {
				const response = await dispatch(
					actions.checkGlossaryConsistency({
						content: debouncedContent,
						projectId,
					}),
				).unwrap();

				if (!isCancelled) {
					glossaryCheckCache.set(debouncedContent, response.matches);
					setGlossaryCheck({
						content: debouncedContent,
						matches: response.matches,
					});
				}
			} catch {
				if (!isCancelled) {
					setGlossaryCheck({ content: debouncedContent, matches: [] });
				}
			} finally {
				if (!isCancelled) {
					setIsCheckingGlossary(false);
				}
			}
		};

		void runGlossaryCheck();

		return () => {
			isCancelled = true;
		};
	}, [debouncedContent, dispatch, projectId]);

	const onAcceptGlossarySuggestion = useCallback(
		(match: GlossaryConsistencyMatchDto): void => {
			onContentChange(
				// A function replacer, not a string one: match.suggestedText is arbitrary
				// LLM output, and a string replacer would treat "$&", "$1", etc. in it as
				// special replacement patterns instead of literal text.
				content.replace(match.sourceExcerpt, () => match.suggestedText),
			);
			setGlossaryCheck((previousCheck) => ({
				...previousCheck,
				matches: previousCheck.matches.filter((item) => item !== match),
			}));
		},
		[content, onContentChange],
	);

	const onKeepGlossarySuggestion = useCallback(
		(match: GlossaryConsistencyMatchDto): void => {
			setGlossaryCheck((previousCheck) => ({
				...previousCheck,
				matches: previousCheck.matches.filter((item) => item !== match),
			}));
		},
		[],
	);

	return {
		glossaryMatches,
		isCheckingGlossary,
		onAcceptGlossarySuggestion,
		onKeepGlossarySuggestion,
	};
};

export { useGlossaryConsistencyCheck };
