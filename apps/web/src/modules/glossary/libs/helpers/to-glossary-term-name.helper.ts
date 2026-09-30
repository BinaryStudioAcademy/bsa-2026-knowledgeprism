const LEADING_ARTICLE = /^(?:a|an|the)\s+/iu;

const toGlossaryTermName = (excerpt: string): string =>
	excerpt.trim().replace(LEADING_ARTICLE, "");

export { toGlossaryTermName };
