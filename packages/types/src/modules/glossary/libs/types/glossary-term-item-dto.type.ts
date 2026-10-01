import { type GlossaryTermOrigin } from "@knowledgeprism/constants";

import { type ValueOf } from "../../../../libs/types/types.js";

type GlossaryTermItemDto = {
	definition: string;
	id: number;
	name: string;
	origin: ValueOf<typeof GlossaryTermOrigin>;
	sourceDocumentName: null | string;
};

export { type GlossaryTermItemDto };
