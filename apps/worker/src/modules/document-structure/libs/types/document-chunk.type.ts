type DocumentChunk = {
	content: string;
	pageEnd: number;
	pageNumber: number;
	part: number;
	position: number;
	sectionIndex: null | number;
	sectionTitle: null | string;
};

export { type DocumentChunk };
