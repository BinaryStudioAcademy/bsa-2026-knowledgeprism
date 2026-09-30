const ExtractionOutputFailure = {
	INVALID_ITEM: "invalid_item",
	INVALID_JSON: "invalid_json",
	INVALID_SHAPE: "invalid_shape",
} as const;

type Failure =
	(typeof ExtractionOutputFailure)[keyof typeof ExtractionOutputFailure];

class ExtractionOutputError extends Error {
	public readonly reason: Failure;

	public constructor(reason: Failure) {
		super(`Invalid extraction output: ${reason}.`);
		this.name = "ExtractionOutputError";
		this.reason = reason;
	}
}

export { ExtractionOutputError, ExtractionOutputFailure };
