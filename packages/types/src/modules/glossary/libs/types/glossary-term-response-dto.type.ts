import { type GlossaryTermOrigin } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/types.js";
import { type GlossaryRelatedTermDto } from "./glossary-related-term-dto.type.js";

type GlossaryTermResponseDto = {
	createdAt: string;
	definition: string;
	id: number;
	name: string;
	origin: ValueOf<typeof GlossaryTermOrigin>;
	projectId: number;
	relatedTerms: GlossaryRelatedTermDto[];
	sourceDocumentName: null | string;
	updatedAt: string;
};

export { type GlossaryTermResponseDto };
