import { type Transaction } from "objection";

import { type GlossaryTermRelationModel } from "../models/glossary-term-relation.model.js";

const EMPTY_LENGTH = 0;

class GlossaryTermRelationRepository {
	private glossaryTermRelationModel: typeof GlossaryTermRelationModel;

	public constructor(
		glossaryTermRelationModel: typeof GlossaryTermRelationModel,
	) {
		this.glossaryTermRelationModel = glossaryTermRelationModel;
	}

	public async replaceForTerm(
		{
			projectId,
			relatedTermIds,
			termId,
		}: { projectId: number; relatedTermIds: number[]; termId: number },
		transaction: Transaction,
	): Promise<void> {
		await this.glossaryTermRelationModel
			.query(transaction)
			.delete()
			.where({ termId })
			.orWhere({ relatedTermId: termId })
			.execute();

		if (relatedTermIds.length === EMPTY_LENGTH) {
			return;
		}

		await this.glossaryTermRelationModel
			.query(transaction)
			.insert(
				relatedTermIds.map((relatedTermId) => ({
					projectId,
					relatedTermId: Math.max(termId, relatedTermId),
					termId: Math.min(termId, relatedTermId),
				})),
			)
			.execute();
	}
}

export { GlossaryTermRelationRepository };
