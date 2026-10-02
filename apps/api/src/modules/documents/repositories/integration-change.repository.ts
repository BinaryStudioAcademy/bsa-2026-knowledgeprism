import { type Transaction } from "objection";

import { toDocumentPlacement } from "~/modules/documents/libs/helpers/to-document-placement.helper.js";
import { IntegrationChangeEntity } from "~/modules/documents/models/integration-change.entity.js";
import { type IntegrationChangeModel } from "~/modules/documents/models/integration-change.model.js";

const EMPTY_LENGTH = 0;

const toEntity = (change: IntegrationChangeModel): IntegrationChangeEntity =>
	IntegrationChangeEntity.initialize({
		documentId: change.documentId,
		duplicateOfExtractionItemId: change.duplicateOfExtractionItemId,
		explanation: change.explanation,
		extractionItemId: change.extractionItemId,
		id: change.id,
		incomingContent: change.incomingContent,
		incomingTitle: change.incomingTitle,
		liveContent: change.liveContent,
		liveTitle: change.liveTitle,
		matchedNodeId: change.matchedNodeId,
		placement: toDocumentPlacement(change.placement),
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
		transaction?: Transaction,
	): Promise<IntegrationChangeEntity[]> {
		const changes = await this.integrationChangeModel
			.query(transaction)
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

	public async updateIncoming(
		{
			documentId,
			extractionItemId,
			incomingContent,
			incomingTitle,
		}: {
			documentId: number;
			extractionItemId: number;
			incomingContent: string;
			incomingTitle: string;
		},
		transaction?: Transaction,
	): Promise<boolean> {
		const updatedCount = await this.integrationChangeModel
			.query(transaction)
			.patch({ incomingContent, incomingTitle })
			.where({ documentId, extractionItemId })
			.execute();

		return updatedCount > EMPTY_LENGTH;
	}
}

export { IntegrationChangeRepository };
