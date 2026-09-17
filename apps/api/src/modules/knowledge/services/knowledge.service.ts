import type { KnowledgeSearchResponseDto } from "@knowledgeprism/types";
// will query knowledge_nodes by title/keyword once the repository layer is ready
class KnowledgeService {
	public search(): KnowledgeSearchResponseDto {
		return {
			items: [],
		};
	}
}

export { KnowledgeService };
