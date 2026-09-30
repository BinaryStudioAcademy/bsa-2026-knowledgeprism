import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { useCallback, useEffect, useState } from "react";

import { useAppDispatch, useCurrentProjectId } from "~/hooks/hooks.js";
import { useDebouncedValue } from "~/hooks/use-debounced-value/use-debounced-value.hook.js";
import { actions } from "~/modules/knowledge/knowledge.js";
import { GLOSSARY_CHECK_DEBOUNCE_MS } from "~/modules/knowledge/libs/constants/constants.js";

type GlossaryCheck = {
	content: string;
	matches: GlossaryConsistencyMatchDto[];
	projectId: string;
};

const INITIAL_GLOSSARY_CHECK: GlossaryCheck = {
	content: "",
	matches: [],
	projectId: "",
};

const glossaryCheckCache = new Map<string, GlossaryConsistencyMatchDto[]>();

const getGlossaryCheckCacheKey = (projectId: string, content: string): string =>
	JSON.stringify([projectId, content]);

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
		glossaryCheck.content === debouncedContent &&
		glossaryCheck.projectId === projectId
			? glossaryCheck.matches
			: [];

	useEffect(() => {
		let isCancelled = false;

		const runGlossaryCheck = async (): Promise<void> => {
			if (!debouncedContent.trim()) {
				setIsCheckingGlossary(false);
				return;
			}

			const cacheKey = getGlossaryCheckCacheKey(projectId, debouncedContent);
			const cachedMatches = glossaryCheckCache.get(cacheKey);

			if (cachedMatches) {
				setGlossaryCheck({
					content: debouncedContent,
					matches: cachedMatches,
					projectId,
				});
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
					glossaryCheckCache.set(cacheKey, response.matches);
					setGlossaryCheck({
						content: debouncedContent,
						matches: response.matches,
						projectId,
					});
				}
			} catch {
				if (!isCancelled) {
					setGlossaryCheck({
						content: debouncedContent,
						matches: [],
						projectId,
					});
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
			const matches = glossaryCheck.matches.filter((item) => item !== match);

			glossaryCheckCache.set(
				getGlossaryCheckCacheKey(
					glossaryCheck.projectId,
					glossaryCheck.content,
				),
				matches,
			);
			setGlossaryCheck({ ...glossaryCheck, matches });
		},
		[glossaryCheck],
	);

	return {
		glossaryMatches,
		isCheckingGlossary,
		onAcceptGlossarySuggestion,
		onKeepGlossarySuggestion,
	};
};

export { useGlossaryConsistencyCheck };
