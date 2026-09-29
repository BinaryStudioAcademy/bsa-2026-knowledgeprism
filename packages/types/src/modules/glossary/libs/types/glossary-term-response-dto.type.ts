import { type GlossaryRelatedTermDto } from "./glossary-related-term-dto.type.js";

type GlossaryTermResponseDto = {
	createdAt: string;
	definition: string;
	id: number;
	name: string;
	projectId: number;
	relatedTerms: GlossaryRelatedTermDto[];
	updatedAt: string;
};

export { type GlossaryTermResponseDto };
