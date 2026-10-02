import { type IntegrationChangeType } from "@knowledgeprism/constants";
import {
	type DocumentPlacementDto,
	type ExtractionContentBlock,
	type ValueOf,
} from "@knowledgeprism/types";

import { type NodeMergeMethod } from "~/modules/documents/libs/constants/node-merge-method.constant.js";
import { toDocumentPlacement } from "~/modules/documents/libs/helpers/to-document-placement.helper.js";
import { type Entity } from "~/shared/types/types.js";

type IntegrationChangeObject = {
	documentId: number;
	duplicateOfExtractionItemId?: null | number;
	explanation: string;
	extractionItemId: number;
	id: number;
	incomingContent: string;
	incomingTitle: string;
	liveContent: null | string;
	liveTitle: null | string;
	matchedNodeId: null | number;
	mergedBlocks?: ExtractionContentBlock[] | null;
	mergeMethod?: null | ValueOf<typeof NodeMergeMethod>;
	placement: DocumentPlacementDto;
	score: null | number;
	type: ValueOf<typeof IntegrationChangeType>;
};

type NewIntegrationChangeObject = Omit<IntegrationChangeObject, "id">;

class IntegrationChangeEntity implements Entity {
	private documentId: number;

	private duplicateOfExtractionItemId: null | number;

	private explanation: string;

	private extractionItemId: number;

	private id: null | number;

	private incomingContent: string;

	private incomingTitle: string;

	private liveContent: null | string;

	private liveTitle: null | string;

	private matchedNodeId: null | number;

	private mergedBlocks: ExtractionContentBlock[] | null;

	private mergeMethod: null | ValueOf<typeof NodeMergeMethod>;

	private placement: DocumentPlacementDto;

	private score: null | number;

	private type: ValueOf<typeof IntegrationChangeType>;

	private constructor({
		documentId,
		duplicateOfExtractionItemId = null,
		explanation,
		extractionItemId,
		id,
		incomingContent,
		incomingTitle,
		liveContent,
		liveTitle,
		matchedNodeId,
		mergedBlocks = null,
		mergeMethod = null,
		placement,
		score,
		type,
	}: NewIntegrationChangeObject & { id: null | number }) {
		this.documentId = documentId;
		this.duplicateOfExtractionItemId = duplicateOfExtractionItemId;
		this.explanation = explanation;
		this.extractionItemId = extractionItemId;
		this.id = id;
		this.incomingContent = incomingContent;
		this.incomingTitle = incomingTitle;
		this.liveContent = liveContent;
		this.liveTitle = liveTitle;
		this.matchedNodeId = matchedNodeId;
		this.mergedBlocks = mergedBlocks;
		this.mergeMethod = mergeMethod;
		this.placement = toDocumentPlacement(placement);
		this.score = score;
		this.type = type;
	}

	public static initialize(
		data: IntegrationChangeObject,
	): IntegrationChangeEntity {
		return new IntegrationChangeEntity(data);
	}

	public static initializeNew(
		data: NewIntegrationChangeObject,
	): IntegrationChangeEntity {
		return new IntegrationChangeEntity({ ...data, id: null });
	}

	public toNewObject(): NewIntegrationChangeObject {
		return {
			documentId: this.documentId,
			duplicateOfExtractionItemId: this.duplicateOfExtractionItemId,
			explanation: this.explanation,
			extractionItemId: this.extractionItemId,
			incomingContent: this.incomingContent,
			incomingTitle: this.incomingTitle,
			liveContent: this.liveContent,
			liveTitle: this.liveTitle,
			matchedNodeId: this.matchedNodeId,
			mergedBlocks: this.mergedBlocks,
			mergeMethod: this.mergeMethod,
			placement: this.placement,
			score: this.score,
			type: this.type,
		};
	}

	public toObject(): IntegrationChangeObject {
		return {
			...this.toNewObject(),
			id: this.id as number,
		};
	}
}

export { IntegrationChangeEntity };
