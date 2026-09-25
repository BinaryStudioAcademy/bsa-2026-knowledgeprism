import { type Transaction } from "objection";

import { IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type IntegrationChangeModel } from "~/modules/documents/models/integration-change.model.js";

const EMPTY_LENGTH = 0;

const toEntity = (change: IntegrationChangeModel): IntegrationChangeEntity =>
	IntegrationChangeEntity.initialize({
		documentId: change.documentId,
		explanation: change.explanation,
		extractionItemId: change.extractionItemId,
		id: change.id,
		incomingContent: change.incomingContent,
		incomingTitle: change.incomingTitle,
		liveContent: change.liveContent,
		liveTitle: change.liveTitle,
		matchedNodeId: change.matchedNodeId,
		score: change.score,
		type: change.type,
	});

class IntegrationChangeRepository {
	private integrationChangeModel: typeof IntegrationChangeModel;

	public constructor(integrationChangeModel: typeof IntegrationChangeModel) {
		this.integrationChangeModel = integrationChangeModel;
	}

	public async findByDocumentId(
		documentId: number,
	): Promise<IntegrationChangeEntity[]> {
		const changes = await this.integrationChangeModel
			.query()
			.where({ documentId })
			.orderBy("id", "asc")
			.execute();

		return changes.map((change) => toEntity(change));
	}

	public async replaceByDocumentId(
		{
			changes,
			documentId,
		}: { changes: IntegrationChangeEntity[]; documentId: number },
		transaction: Transaction,
	): Promise<void> {
		await this.integrationChangeModel
			.query(transaction)
			.delete()
			.where({ documentId })
			.execute();

		if (changes.length === EMPTY_LENGTH) {
			return;
		}

		await this.integrationChangeModel
			.query(transaction)
			.insert(changes.map((change) => change.toNewObject()))
			.execute();
	}
}

export { IntegrationChangeRepository };
