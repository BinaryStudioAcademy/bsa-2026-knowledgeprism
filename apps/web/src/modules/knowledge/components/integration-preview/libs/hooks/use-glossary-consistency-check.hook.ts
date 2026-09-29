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

const glossaryCheckCache = new Map<string, GlossaryConsistencyMatchDto[]>();

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
