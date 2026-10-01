import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
	ExtractionOutputError,
	ExtractionOutputFailure,
} from "../exceptions/extraction-output-error.exception.js";
import { mapExtractionOutput } from "./map-extraction-output.helper.js";

const BOLD_RUN_INDEX = 0;
const BULLET_BLOCK_INDEX = 2;
const SECTION_BLOCK_COUNT = 3;
const EXPLANATION_RUN_INDEX = 1;
const FIRST_CAPABILITY_INDEX = 1;
const SECOND_CAPABILITY_INDEX = 2;
const CALLOUT_BLOCK_INDEX = 4;
const CHECKLIST_BLOCK_INDEX = 3;
const FIRST_RUN_INDEX = 0;
const HEADING_BLOCK_INDEX = 0;
const NESTED_HEADING_BLOCK_INDEX = 5;
const PARAGRAPH_BLOCK_INDEX = 1;
const SECOND_RUN_INDEX = 1;
const CHUNK = [
	"Overview",
	"The limit is 10.",
	"Keep a backup.",
	"Use Postgres.",
	"Setup",
].join("\n");
const CONFIDENCE = 0.8;
const FIRST_ITEM_INDEX = 0;
const HEADING_LEVEL_NESTED = 3;
const HEADING_LEVEL_SECTION = 2;
const PAGE_NUMBER = 2;
const SECOND_ITEM_INDEX = 1;
const SINGLE_ITEM_COUNT = 1;
const TWO_ITEM_COUNT = 2;

const textRun = (
	text: string,
	styles: Record<string, unknown> = {},
): { styles: Record<string, unknown>; text: string; type: "text" } => {
	return { styles, text, type: "text" };
};

const headingBlock = (
	text: string,
	level: number = HEADING_LEVEL_SECTION,
): {
	content: ReturnType<typeof textRun>[];
	props: { level: number };
	type: "heading";
} => {
	return {
		content: [textRun(text)],
		props: { level },
		type: "heading",
	};
};

const section = (
	overrides: Record<string, unknown> = {},
): Record<string, unknown> => {
	return {
		blocks: [
			headingBlock("Overview"),
			{
				content: [textRun("The limit is 10.", { backgroundColor: "yellow" })],
				type: "paragraph",
			},
			{
				content: [textRun("Keep a backup.")],
				type: "bulletListItem",
			},
			{
				content: [textRun("Keep a backup.", { bold: true })],
				props: { checked: false },
				type: "checkListItem",
			},
			{
				content: [textRun("Use Postgres.")],
				props: { variant: "decision" },
				type: "callout",
			},
			headingBlock("Setup", HEADING_LEVEL_NESTED),
		],
		confidence: CONFIDENCE,
		heading: "Overview",
		order: 1,
		sourceExcerpt: "The limit is 10.",
		...overrides,
	};
};

const toOutput = (sections: unknown[]): unknown => ({ items: sections });

const mapSections = (
	sections: unknown[],
	pageNumber: number,
	chunk: string,
): ReturnType<typeof mapExtractionOutput> =>
	mapExtractionOutput(toOutput(sections), pageNumber, chunk);

const isInvalidItemError = (error: unknown): boolean =>
	error instanceof ExtractionOutputError &&
	error.reason === ExtractionOutputFailure.INVALID_ITEM;

void describe("mapExtractionOutput", () => {
	void it("stores section blocks and turns a callout into a labeled paragraph", () => {
		const items = mapSections([section()], PAGE_NUMBER, CHUNK);
		const item = items[FIRST_ITEM_INDEX];

		assert.equal(items.length, SINGLE_ITEM_COUNT);
		assert.ok(item);

		const heading = item.blocks[HEADING_BLOCK_INDEX];
		const paragraph = item.blocks[PARAGRAPH_BLOCK_INDEX];
		const bullet = item.blocks[BULLET_BLOCK_INDEX];
		const checklist = item.blocks[CHECKLIST_BLOCK_INDEX];
		const callout = item.blocks[CALLOUT_BLOCK_INDEX];
		const nestedHeading = item.blocks[NESTED_HEADING_BLOCK_INDEX];

		assert.ok(heading);
		assert.ok(paragraph);
		assert.ok(bullet);
		assert.ok(checklist);
		assert.ok(callout);
		assert.ok(nestedHeading);

		const paragraphRun = paragraph.content[FIRST_RUN_INDEX];
		const calloutLabel = callout.content[FIRST_RUN_INDEX];
		const calloutBody = callout.content[SECOND_RUN_INDEX];

		assert.ok(paragraphRun);
		assert.ok(calloutLabel);
		assert.ok(calloutBody);
		assert.equal(item.heading, "Overview");
		assert.equal(item.title, "Overview");
		assert.equal(item.sourcePageNumber, PAGE_NUMBER);
		assert.equal(heading.type, "heading");
		assert.equal(paragraph.type, "paragraph");
		assert.equal(paragraphRun.styles?.backgroundColor, "yellow");
		assert.equal(bullet.type, "bulletListItem");
		assert.equal(checklist.type, "checkListItem");
		assert.equal(checklist.props?.checked, false);
		assert.equal(nestedHeading.type, "heading");
		assert.equal(nestedHeading.props?.level, HEADING_LEVEL_NESTED);
		assert.equal(callout.type, "paragraph");
		assert.equal(callout.props?.backgroundColor, "blue");
		assert.equal(calloutLabel.text, "Decision");
		assert.equal(calloutLabel.styles?.bold, true);
		assert.equal(calloutBody.text, " Use Postgres.");
		assert.equal(item.text.includes("The limit is 10."), true);
	});

	void it("keeps a section whose excerpt differs only by whitespace and stores the source text", () => {
		const items = mapSections(
			[section({ sourceExcerpt: "The limit is 10. Keep a backup." })],
			PAGE_NUMBER,
			CHUNK,
		);
		const [item] = items;

		assert.equal(items.length, SINGLE_ITEM_COUNT);
		assert.equal(item?.sourceExcerpt, "The limit is 10.\nKeep a backup.");
	});

	void it("keeps a section whose excerpt skips source text between its lines", () => {
		const items = mapSections(
			[section({ sourceExcerpt: "Overview\nUse Postgres." })],
			PAGE_NUMBER,
			CHUNK,
		);
		const [item] = items;

		assert.equal(items.length, SINGLE_ITEM_COUNT);
		assert.equal(
			item?.sourceExcerpt,
			"Overview\nThe limit is 10.\nKeep a backup.\nUse Postgres.",
		);
	});

	void it("sorts sections by order", () => {
		const items = mapSections(
			[
				section({
					blocks: [
						headingBlock("Setup"),
						{
							content: [textRun("Keep a backup.")],
							type: "paragraph",
						},
					],
					heading: "Setup",
					order: 2,
					sourceExcerpt: "Setup",
				}),
				section(),
			],
			PAGE_NUMBER,
			CHUNK,
		);

		assert.equal(items.length, TWO_ITEM_COUNT);
		assert.equal(items[FIRST_ITEM_INDEX]?.heading, "Overview");
		assert.equal(items[SECOND_ITEM_INDEX]?.heading, "Setup");
	});

	void it("rejects the attempt when a block type is outside the allowed list", () => {
		const output = toOutput([
			section({
				blocks: [
					headingBlock("Overview"),
					{ content: [textRun("The limit is 10.")], type: "quote" },
				],
			}),
		]);

		assert.throws(
			() => mapExtractionOutput(output, PAGE_NUMBER, CHUNK),
			isInvalidItemError,
		);
	});

	void it("rejects the attempt when styles are not bold or yellow", () => {
		const output = toOutput([
			section({
				blocks: [
					headingBlock("Overview"),
					{
						content: [textRun("The limit is 10.", { textColor: "red" })],
						type: "paragraph",
					},
				],
			}),
		]);

		assert.throws(
			() => mapExtractionOutput(output, PAGE_NUMBER, CHUNK),
			isInvalidItemError,
		);
	});

	void it("rejects the attempt when the heading block text does not equal heading", () => {
		const output = toOutput([
			section({
				blocks: [
					headingBlock("Introduction"),
					{
						content: [textRun("The limit is 10.")],
						type: "paragraph",
					},
				],
			}),
		]);

		assert.throws(
			() => mapExtractionOutput(output, PAGE_NUMBER, CHUNK),
			isInvalidItemError,
		);
	});

	void it("returns an empty list when the model finds no sections", () => {
		assert.deepEqual(mapSections([], PAGE_NUMBER, CHUNK), []);
	});

	void it("rejects the attempt when one section excerpt is not in the chunk", () => {
		const output = toOutput([
			section(),
			section({ sourceExcerpt: "not in the chunk" }),
		]);

		assert.throws(
			() => mapExtractionOutput(output, PAGE_NUMBER, CHUNK),
			isInvalidItemError,
		);
	});

	void it("saves numbered capability names as a list with bold lead-ins", () => {
		const source = [
			"Core Capabilities",
			"1. Unified Knowledge Base",
			"Creates a centralized and structured knowledge base.",
			"2. Contextual Product Understanding",
			"Builds an evolving understanding of the product.",
		].join("\n");
		const items = mapSections(
			[
				section({
					blocks: [
						headingBlock("Core Capabilities"),
						{
							content: [textRun("1. Unified Knowledge Base")],
							type: "paragraph",
						},
						{
							content: [
								textRun("Creates a centralized and structured knowledge base."),
							],
							type: "paragraph",
						},
						{
							content: [textRun("2. Contextual Product Understanding")],
							type: "paragraph",
						},
						{
							content: [
								textRun("Builds an evolving understanding of the product."),
							],
							type: "paragraph",
						},
					],
					heading: "Core Capabilities",
					sourceExcerpt: source,
				}),
			],
			PAGE_NUMBER,
			source,
		);
		const item = items[FIRST_ITEM_INDEX];

		assert.ok(item);

		const firstCapability = item.blocks[FIRST_CAPABILITY_INDEX];
		const secondCapability = item.blocks[SECOND_CAPABILITY_INDEX];

		assert.ok(firstCapability);
		assert.ok(secondCapability);

		const firstName = firstCapability.content[BOLD_RUN_INDEX];
		const firstExplanation = firstCapability.content[EXPLANATION_RUN_INDEX];
		const secondName = secondCapability.content[BOLD_RUN_INDEX];

		assert.ok(firstName);
		assert.ok(firstExplanation);
		assert.ok(secondName);
		assert.equal(item.blocks.length, SECTION_BLOCK_COUNT);
		assert.equal(firstCapability.type, "numberedListItem");
		assert.equal(firstName.text, "Unified Knowledge Base");
		assert.equal(firstName.styles?.bold, true);
		assert.equal(
			firstExplanation.text,
			" Creates a centralized and structured knowledge base.",
		);
		assert.equal(secondCapability.type, "numberedListItem");
		assert.equal(secondName.text, "Contextual Product Understanding");
		assert.equal(secondName.styles?.bold, true);
	});

	void it("saves dashed capability names as a numbered list when the source numbers them", () => {
		const source = [
			"1. Unified Knowledge Base",
			"2. Contextual Product Understanding",
		].join("\n");
		const items = mapSections(
			[
				section({
					blocks: [
						headingBlock("Core Capabilities"),
						{
							content: [
								textRun(
									"Unified Knowledge Base — Creates a centralized knowledge base.",
								),
							],
							type: "paragraph",
						},
						{
							content: [
								textRun(
									"Contextual Product Understanding — Builds an evolving understanding.",
								),
							],
							type: "paragraph",
						},
					],
					heading: "Core Capabilities",
					sourceExcerpt: source,
				}),
			],
			PAGE_NUMBER,
			source,
		);
		const item = items[FIRST_ITEM_INDEX];

		assert.ok(item);

		const capability = item.blocks[FIRST_CAPABILITY_INDEX];

		assert.ok(capability);

		const name = capability.content[BOLD_RUN_INDEX];
		const explanation = capability.content[EXPLANATION_RUN_INDEX];

		assert.ok(name);
		assert.ok(explanation);
		assert.equal(capability.type, "numberedListItem");
		assert.equal(name.text, "Unified Knowledge Base");
		assert.equal(name.styles?.bold, true);
		assert.equal(explanation.text, " — Creates a centralized knowledge base.");
	});

	void it("saves a name line plus its explanation as a numbered list when the source numbers them", () => {
		const source = [
			"1. Unified Knowledge Base",
			"Creates a centralized knowledge base.",
			"2. Contextual Product Understanding",
			"Builds an evolving understanding.",
		].join("\n");
		const items = mapSections(
			[
				section({
					blocks: [
						headingBlock("Core Capabilities"),
						{
							content: [textRun("Unified Knowledge Base")],
							type: "paragraph",
						},
						{
							content: [textRun("Creates a centralized knowledge base.")],
							type: "paragraph",
						},
						{
							content: [textRun("Contextual Product Understanding")],
							type: "paragraph",
						},
						{
							content: [textRun("Builds an evolving understanding.")],
							type: "paragraph",
						},
					],
					heading: "Core Capabilities",
					sourceExcerpt: source,
				}),
			],
			PAGE_NUMBER,
			source,
		);
		const item = items[FIRST_ITEM_INDEX];

		assert.ok(item);

		const capability = item.blocks[FIRST_CAPABILITY_INDEX];

		assert.ok(capability);

		const name = capability.content[BOLD_RUN_INDEX];
		const explanation = capability.content[EXPLANATION_RUN_INDEX];

		assert.ok(name);
		assert.ok(explanation);
		assert.equal(capability.type, "numberedListItem");
		assert.equal(name.text, "Unified Knowledge Base");
		assert.equal(name.styles?.bold, true);
		assert.equal(explanation.text, " Creates a centralized knowledge base.");
	});

	void it("bolds a lead-in the model already put in one list item", () => {
		const source =
			"Unified Knowledge Base — Creates a centralized knowledge base.";
		const items = mapSections(
			[
				section({
					blocks: [
						headingBlock("Core Capabilities"),
						{
							content: [textRun(source)],
							type: "numberedListItem",
						},
					],
					heading: "Core Capabilities",
					sourceExcerpt: source,
				}),
			],
			PAGE_NUMBER,
			source,
		);
		const item = items[FIRST_ITEM_INDEX];

		assert.ok(item);

		const capability = item.blocks[FIRST_CAPABILITY_INDEX];

		assert.ok(capability);

		const name = capability.content[BOLD_RUN_INDEX];

		assert.ok(name);
		assert.equal(capability.type, "numberedListItem");
		assert.equal(name.text, "Unified Knowledge Base");
		assert.equal(name.styles?.bold, true);
	});

	void it("reads fenced JSON output", () => {
		const output = JSON.stringify(toOutput([section()]));
		const items = mapExtractionOutput(
			`\`\`\`json\n${output}\n\`\`\``,
			PAGE_NUMBER,
			CHUNK,
		);

		assert.equal(items.length, SINGLE_ITEM_COUNT);
		assert.equal(items[FIRST_ITEM_INDEX]?.heading, "Overview");
	});

	void it("throws a retryable output error for malformed JSON", () => {
		assert.throws(
			() => mapExtractionOutput("[{", PAGE_NUMBER, CHUNK),
			(error: unknown) =>
				error instanceof ExtractionOutputError &&
				error.reason === ExtractionOutputFailure.INVALID_JSON,
		);
	});

	void it("throws a retryable output error when the output has no items array", () => {
		assert.throws(
			() =>
				mapExtractionOutput(
					JSON.stringify({ heading: "Overview" }),
					PAGE_NUMBER,
					CHUNK,
				),
			(error: unknown) =>
				error instanceof ExtractionOutputError &&
				error.reason === ExtractionOutputFailure.INVALID_SHAPE,
		);
	});
});
