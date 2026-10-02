type ExtractionResponseRecord = {
	attempt: number;
	chunkIndex: number;
	errorReason: null | string;
	rawResponse: null | string;
	splitPart: null | number;
};

export { type ExtractionResponseRecord };
