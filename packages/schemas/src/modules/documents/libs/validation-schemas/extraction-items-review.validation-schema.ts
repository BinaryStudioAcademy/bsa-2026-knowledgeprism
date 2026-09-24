import { z } from "zod";

const itemIdentifiers = z.array(z.number().int().positive());

const extractionItemsReview = z
	.object({
		approvedIds: itemIdentifiers,
		rejectedIds: itemIdentifiers,
	})
	.required();

export { extractionItemsReview };
