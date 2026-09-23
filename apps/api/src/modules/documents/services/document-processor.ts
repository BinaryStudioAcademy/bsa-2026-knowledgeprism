import {
	DocumentErrorMessage,
	DocumentSourceType,
} from "@knowledgeprism/constants";
import {
	downloadDocument,
	extract,
	type ExtractionBlock,
	parseDocument,
} from "@knowledgeprism/worker";

import { type DocumentEntity } from "~/modules/documents/models/document.entity.js";
import { type DocumentRepository } from "~/modules/documents/repositories/document.repository.js";
import { type ExtractionItemRepository } from "~/modules/documents/repositories/extraction-item.repository.js";

const MANUAL_TEXT_PAGE_NUMBER = 1;

type Constructor = {
	documentRepository: DocumentRepository;
	extractionItemRepository: ExtractionItemRepository;
};

class DocumentProcessor {
	private documentRepository: DocumentRepository;

	private extractionItemRepository: ExtractionItemRepository;

	public constructor({
		documentRepository,
		extractionItemRepository,
	}: Constructor) {
		this.documentRepository = documentRepository;
		this.extractionItemRepository = extractionItemRepository;
	}

	private async loadPages(
		document: DocumentEntity,
	): Promise<ExtractionBlock[]> {
		const { content, mimeType, s3Key, sourceType } = document.toObject();

		if (sourceType === DocumentSourceType.MANUAL) {
			return [{ content: content ?? "", pageNumber: MANUAL_TEXT_PAGE_NUMBER }];
		}

		if (!s3Key) {
			throw new Error("Uploaded document has no S3 key.");
		}

		const bytes = await downloadDocument(s3Key);

		return await parseDocument({ bytes, contentType: mimeType });
	}

	public async process(documentId: number): Promise<void> {
		const document = await this.documentRepository.findById(documentId);

		if (!document) {
			throw new Error(DocumentErrorMessage.NOT_FOUND);
		}

		const pages = await this.loadPages(document);
		const items = await extract(pages);

		await this.extractionItemRepository.replacePending({ documentId, items });
	}
}

export { DocumentProcessor };
