import { type ParsedPageBlock } from "~/parsers/libs/types/parsed-page-block.type.js";

import { body, heading, toFixturePage } from "./to-fixture-page.helper.js";

const CORE_CAPABILITIES_PAGE_NUMBER = 2;
const NUMBER_OFFSET = 1;

const CORE_CAPABILITIES = [
	"Unified Knowledge Base builds one structured knowledge base from project files.",
	"Consistency Engine finds contradictions and gaps across the documentation.",
	"Ask Prism answers questions from the knowledge base with sources.",
	"Living Documentation keeps the knowledge base up to date as files change.",
	"Requirement Intelligence turns early ideas into structured requirements.",
	"QA Assistant generates test checklists from the requirements.",
] as const;

const CORE_CAPABILITIES_PAGES: ParsedPageBlock[] = [
	toFixturePage(CORE_CAPABILITIES_PAGE_NUMBER, [
		heading("How It Works"),
		body(
			"Teams upload documents and the platform proposes structured knowledge.",
		),
		body(
			"A person validates the proposal before it reaches the knowledge base.",
		),
		heading("Core Capabilities"),
		...CORE_CAPABILITIES.map((capability, index) =>
			body(`${String(index + NUMBER_OFFSET)}. ${capability}`),
		),
		heading("Key Principles"),
		body(
			"AI proposes, the user validates, the system integrates, the user approves.",
		),
	]),
];

export {
	CORE_CAPABILITIES,
	CORE_CAPABILITIES_PAGE_NUMBER,
	CORE_CAPABILITIES_PAGES,
};
