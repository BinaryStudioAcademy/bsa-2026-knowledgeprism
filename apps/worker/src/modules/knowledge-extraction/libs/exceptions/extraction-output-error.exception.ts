const ExtractionOutputFailure = {
	INVALID_ITEM: "invalid_item",
	INVALID_JSON: "invalid_json",
	INVALID_SHAPE: "invalid_shape",
} as const;

const ExtractionItemRejection = {
	EMPTY_TEXT: "empty_text",
	EXCERPT_NOT_IN_CHUNK: "excerpt_not_in_chunk",
	HEADING_BLOCK_MISMATCH: "heading_block_mismatch",
	INVALID_BLOCK: "invalid_block",
	INVALID_CONFIDENCE: "invalid_confidence",
	INVALID_HEADING: "invalid_heading",
	INVALID_ORDER: "invalid_order",
	MISSING_BLOCKS: "missing_blocks",
	NOT_AN_OBJECT: "not_an_object",
	UNGROUNDED_TEXT: "ungrounded_text",
} as const;

type Failure =
	(typeof ExtractionOutputFailure)[keyof typeof ExtractionOutputFailure];

type Rejection =
	(typeof ExtractionItemRejection)[keyof typeof ExtractionItemRejection];

class ExtractionOutputError extends Error {
	public readonly detail: null | Rejection;

	public readonly reason: Failure;

	public constructor(reason: Failure, detail: null | Rejection = null) {
		super(`Invalid extraction output: ${reason}.`);
		this.name = "ExtractionOutputError";
		this.reason = reason;
		this.detail = detail;
	}
}

export {
	type Rejection,
	ExtractionItemRejection,
	ExtractionOutputError,
	ExtractionOutputFailure,
};
