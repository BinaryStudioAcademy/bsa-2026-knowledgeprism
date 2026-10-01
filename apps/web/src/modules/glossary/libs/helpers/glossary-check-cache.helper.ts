import { type GlossaryConsistencyMatchDto } from "@knowledgeprism/types";

type CacheKey = {
	projectId: string;
	revision: number;
	text: string;
};

const MAXIMUM_CACHED_TEXTS = 300;
const INITIAL_REVISION = 0;

const cachedMatches = new Map<string, GlossaryConsistencyMatchDto[]>();
const cacheRevision = { current: INITIAL_REVISION };
const keptSuggestionIds = new Set<string>();

const toCacheKey = (projectId: string, text: string): string =>
	JSON.stringify([projectId, text]);

const syncRevision = (revision: number): void => {
	if (revision <= cacheRevision.current) {
		return;
	}

	cachedMatches.clear();
	cacheRevision.current = revision;
};

const evictOldestEntries = (): void => {
	for (const key of cachedMatches.keys()) {
		if (cachedMatches.size <= MAXIMUM_CACHED_TEXTS) {
			return;
		}

		cachedMatches.delete(key);
	}
};

const getCachedGlossaryMatches = ({
	projectId,
	revision,
	text,
}: CacheKey): GlossaryConsistencyMatchDto[] | undefined => {
	syncRevision(revision);

	const key = toCacheKey(projectId, text);
	const matches = cachedMatches.get(key);

	if (matches) {
		cachedMatches.delete(key);
		cachedMatches.set(key, matches);
	}

	return matches;
};

const setCachedGlossaryMatches = ({
	matches,
	projectId,
	revision,
	text,
}: CacheKey & { matches: GlossaryConsistencyMatchDto[] }): void => {
	syncRevision(revision);

	if (revision < cacheRevision.current) {
		return;
	}

	const key = toCacheKey(projectId, text);

	cachedMatches.delete(key);
	cachedMatches.set(key, matches);
	evictOldestEntries();
};

const toKeptSuggestionId = (
	projectId: string,
	sectionId: string,
	highlightId: string,
): string => JSON.stringify([projectId, sectionId, highlightId]);

const isGlossarySuggestionKept = (
	projectId: string,
	sectionId: string,
	highlightId: string,
): boolean =>
	keptSuggestionIds.has(toKeptSuggestionId(projectId, sectionId, highlightId));

const keepGlossarySuggestion = (
	projectId: string,
	sectionId: string,
	highlightId: string,
): void => {
	keptSuggestionIds.add(toKeptSuggestionId(projectId, sectionId, highlightId));
};

export {
	getCachedGlossaryMatches,
	isGlossarySuggestionKept,
	keepGlossarySuggestion,
	setCachedGlossaryMatches,
};
