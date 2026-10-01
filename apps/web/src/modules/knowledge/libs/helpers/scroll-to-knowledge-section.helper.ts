const KNOWLEDGE_SECTION_ATTRIBUTE = "data-knowledge-section";
const SECTION_SCROLL_GAP = 12;
const TOP_OF_DOCUMENT = 0;

const scrollContainerTo = (container: HTMLElement, top: number): void => {
	if (typeof container.scrollTo === "function") {
		container.scrollTo({ top });
		return;
	}

	container.scrollTop = top;
};

const scrollToKnowledgeSection = (
	container: HTMLElement,
	sectionId: number | undefined,
): void => {
	if (sectionId === undefined) {
		scrollContainerTo(container, TOP_OF_DOCUMENT);
		return;
	}

	const target = container.querySelector<HTMLElement>(
		`[${CSS.escape(KNOWLEDGE_SECTION_ATTRIBUTE)}="${CSS.escape(String(sectionId))}"]`,
	);

	if (!target) {
		return;
	}

	const top =
		target.getBoundingClientRect().top -
		container.getBoundingClientRect().top +
		container.scrollTop -
		SECTION_SCROLL_GAP;

	scrollContainerTo(container, Math.max(TOP_OF_DOCUMENT, top));
};

export { KNOWLEDGE_SECTION_ATTRIBUTE, scrollToKnowledgeSection };
