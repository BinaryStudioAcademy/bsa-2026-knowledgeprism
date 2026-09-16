type KnowledgeEntryResponseDto = {
	contentJson: Record<string, unknown>[];
	createdAt: string;
	id: number;
	projectId: number;
	title: string;
	updatedAt: string;
};

export { type KnowledgeEntryResponseDto };
