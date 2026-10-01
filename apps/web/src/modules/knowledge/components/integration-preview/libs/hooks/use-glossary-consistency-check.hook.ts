import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";
import { useCallback, useEffect, useState } from "react";

import {
	useAppDispatch,
	useAppSelector,
	useCurrentProjectId,
} from "~/hooks/hooks.js";
import { useDebouncedValue } from "~/hooks/use-debounced-value/use-debounced-value.hook.js";
import {
	getCachedGlossaryMatches,
	isGlossarySuggestionKept,
	keepGlossarySuggestion,
	setCachedGlossaryMatches,
	toGlossaryHighlightId,
} from "~/modules/glossary/libs/helpers/helpers.js";
import { actions } from "~/modules/knowledge/knowledge.js";
import { GLOSSARY_CHECK_DEBOUNCE_MS } from "~/modules/knowledge/libs/constants/constants.js";

type GlossaryCheck = {
	content: string;
	matches: GlossaryConsistencyMatchDto[];
	projectId: string;
	revision: number;
};

const INITIAL_REVISION = 0;

const INITIAL_GLOSSARY_CHECK: GlossaryCheck = {
	content: "",
	matches: [],
	projectId: "",
	revision: INITIAL_REVISION,
};

const useGlossaryConsistencyCheck = ({
	content,
	onContentChange,
	sectionId,
}: {
	content: string;
	onContentChange: (content: string) => void;
	sectionId: string;
}): {
	glossaryMatches: GlossaryConsistencyMatchDto[];
	isCheckingGlossary: boolean;
	onAcceptGlossarySuggestion: (match: GlossaryConsistencyMatchDto) => void;
	onKeepGlossarySuggestion: (match: GlossaryConsistencyMatchDto) => void;
} => {
	const dispatch = useAppDispatch();
	const projectId = useCurrentProjectId();
	const revision = useAppSelector(({ glossary }) => glossary.revision);
	const [glossaryCheck, setGlossaryCheck] = useState<GlossaryCheck>(
		INITIAL_GLOSSARY_CHECK,
	);
	const [isCheckingGlossary, setIsCheckingGlossary] = useState<boolean>(false);
	const debouncedContent = useDebouncedValue(
		content,
		GLOSSARY_CHECK_DEBOUNCE_MS,
	);
	const isCheckCurrent =
		glossaryCheck.content === debouncedContent &&
		glossaryCheck.projectId === projectId &&
		glossaryCheck.revision === revision;
	const glossaryMatches = isCheckCurrent
		? glossaryCheck.matches.filter(
				(match) =>
					!isGlossarySuggestionKept(
						projectId,
						sectionId,
						toGlossaryHighlightId(match),
					),
			)
		: [];

	useEffect(() => {
		let isCancelled = false;

		const runGlossaryCheck = async (): Promise<void> => {
			if (!debouncedContent.trim()) {
				setIsCheckingGlossary(false);
				return;
			}

			const cachedMatches = getCachedGlossaryMatches({
				projectId,
				revision,
				text: debouncedContent,
			});

			if (cachedMatches) {
				setGlossaryCheck({
					content: debouncedContent,
					matches: cachedMatches,
					projectId,
					revision,
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
					setCachedGlossaryMatches({
						matches: response.matches,
						projectId,
						revision,
						text: debouncedContent,
					});
					setGlossaryCheck({
						content: debouncedContent,
						matches: response.matches,
						projectId,
						revision,
					});
				}
			} catch {
				if (!isCancelled) {
					setGlossaryCheck({
						content: debouncedContent,
						matches: [],
						projectId,
						revision,
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
	}, [debouncedContent, dispatch, projectId, revision]);

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
			keepGlossarySuggestion(
				projectId,
				sectionId,
				toGlossaryHighlightId(match),
			);
			setGlossaryCheck((previousCheck) => ({
				...previousCheck,
				matches: previousCheck.matches.filter((item) => item !== match),
			}));
		},
		[projectId, sectionId],
	);

	return {
		glossaryMatches,
		isCheckingGlossary,
		onAcceptGlossarySuggestion,
		onKeepGlossarySuggestion,
	};
};

export { useGlossaryConsistencyCheck };
