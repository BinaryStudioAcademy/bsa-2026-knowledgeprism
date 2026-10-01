import { describe, expect, it, vi } from "vitest";

import {
	KNOWLEDGE_SECTION_ATTRIBUTE,
	scrollToKnowledgeSection,
} from "./scroll-to-knowledge-section.helper.js";

const CONTAINER_TOP = 100;
const SCROLL_GAP = 12;
const SCROLL_TOP = 20;
const MISSING_SECTION_ID = 99;
const SECTION_ID = 22;
const SECTION_TOP = 400;
const TARGET_TOP = SECTION_TOP - CONTAINER_TOP + SCROLL_TOP - SCROLL_GAP;

const rect = (top: number): DOMRect => {
	return {
		bottom: top,
		height: 0,
		left: 0,
		right: 0,
		toJSON: () => ({}),
		top,
		width: 0,
		x: 0,
		y: top,
	};
};

const createContainer = (sectionId: number): HTMLElement => {
	const container = document.createElement("div");
	const section = document.createElement("section");

	section.setAttribute(KNOWLEDGE_SECTION_ATTRIBUTE, String(sectionId));
	container.append(section);
	container.scrollTop = SCROLL_TOP;
	container.getBoundingClientRect = () => rect(CONTAINER_TOP);
	section.getBoundingClientRect = () => rect(SECTION_TOP);

	return container;
};

describe("scrollToKnowledgeSection", () => {
	it("scrolls the document pane to the selected heading", () => {
		const container = createContainer(SECTION_ID);
		const scrollTo = vi.fn();

		container.scrollTo = scrollTo;
		scrollToKnowledgeSection(container, SECTION_ID);

		expect(scrollTo).toHaveBeenCalledWith({ top: TARGET_TOP });
	});

	it("returns to the top of the document when no heading is selected", () => {
		const container = createContainer(SECTION_ID);
		const scrollTo = vi.fn();

		container.scrollTo = scrollTo;
		scrollToKnowledgeSection(container, undefined);

		expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
	});

	it("leaves the pane alone when the heading is not in the document", () => {
		const container = createContainer(SECTION_ID);
		const scrollTo = vi.fn();

		container.scrollTo = scrollTo;
		scrollToKnowledgeSection(container, MISSING_SECTION_ID);

		expect(scrollTo).not.toHaveBeenCalled();
	});
});
