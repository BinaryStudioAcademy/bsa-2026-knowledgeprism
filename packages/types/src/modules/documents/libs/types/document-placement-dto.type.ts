type DocumentPlacementDto = {
	matches: DocumentWordingMatchDto[];
	parentExtractionItemId: null | number;
	parentId: null | number;
	parentTitle: null | string;
	proposesParent: boolean;
	siblingOrder: null | number;
};

type DocumentWordingMatchDto = {
	content: string;
	nodeId: number;
	span: string;
	title: string;
};

export { type DocumentPlacementDto };
