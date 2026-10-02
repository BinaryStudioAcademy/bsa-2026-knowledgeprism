import { ExtractionItemRejection } from "../exceptions/extraction-output-error.exception.js";

const GENERIC_EXTRACTION_FEEDBACK =
	"The previous answer did not follow the output rules. Follow them exactly.";

const ExtractionRejectionFeedback: Partial<Record<string, string>> = {
	[ExtractionItemRejection.EXCERPT_NOT_IN_CHUNK]:
		"excerptStart or excerptEnd was not found in <page>. Copy both character-for-character from <page>, including punctuation.",
	[ExtractionItemRejection.HEADING_BLOCK_MISMATCH]:
		"The first block of each section must be a heading block whose text equals the heading field.",
	[ExtractionItemRejection.INVALID_BLOCK]:
		"A block broke the block rules. Use only the allowed block types; a callout needs props.variant decision, warning or note.",
	[ExtractionItemRejection.UNGROUNDED_TEXT]:
		"A heading or block used words that are not in <page>. Use only headings and wording from <page>; content without its own heading in <page> belongs to the previous section.",
};

export { ExtractionRejectionFeedback, GENERIC_EXTRACTION_FEEDBACK };
