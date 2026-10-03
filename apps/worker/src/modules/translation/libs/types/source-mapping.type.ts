type SourceMapping = {
	source: SourceRange;
	target: SourceRange;
};

type SourceRange = {
	end: number;
	start: number;
};

export { type SourceMapping, type SourceRange };
