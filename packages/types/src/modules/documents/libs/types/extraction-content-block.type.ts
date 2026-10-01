const ExtractionBlockBackground = {
	DECISION: "blue",
	NOTE: "yellow",
	WARNING: "orange",
} as const;

const ExtractionHeadingLevel = {
	NESTED: 3,
	SECTION: 2,
} as const;

type ExtractionBlockBackgroundValue =
	(typeof ExtractionBlockBackground)[keyof typeof ExtractionBlockBackground];

type ExtractionContentBlock = {
	content: ExtractionInlineContent[];
	props?: {
		backgroundColor?: ExtractionBlockBackgroundValue;
		checked?: boolean;
		level?: ExtractionHeadingLevelValue;
	};
	type:
		| "bulletListItem"
		| "checkListItem"
		| "heading"
		| "numberedListItem"
		| "paragraph";
};

type ExtractionHeadingLevelValue =
	(typeof ExtractionHeadingLevel)[keyof typeof ExtractionHeadingLevel];

type ExtractionInlineContent = {
	styles?: ExtractionTextStyle;
	text: string;
	type: "text";
};

type ExtractionTextStyle = {
	backgroundColor?: "yellow";
	bold?: true;
};

export {
	type ExtractionBlockBackgroundValue,
	type ExtractionContentBlock,
	ExtractionBlockBackground,
	ExtractionHeadingLevel,
};
