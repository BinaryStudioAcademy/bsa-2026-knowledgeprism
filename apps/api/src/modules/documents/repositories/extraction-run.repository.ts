import { type ValueOf } from "@knowledgeprism/types";

import { ExtractionRunStatus } from "../libs/constants/extraction-run-status.constant.js";
import { type DocumentChunkModel } from "../models/document-chunk.model.js";
import { type ExtractionResponseModel } from "../models/extraction-response.model.js";
import { type ExtractionRunModel } from "../models/extraction-run.model.js";

type NewDocumentChunk = {
	content: string;
	pageEnd: number;
	pageStart: number;
	position: number;
	sectionTitle: null | string;
};

type NewExtractionResponse = {
	attempt: number;
	documentChunkId: number;
	errorReason: null | string;
	rawResponse: null | string;
	splitPart: null | number;
};

const EMPTY_LENGTH = 0;

class ExtractionRunRepository {
	private documentChunkModel: typeof DocumentChunkModel;

	private extractionResponseModel: typeof ExtractionResponseModel;

	private extractionRunModel: typeof ExtractionRunModel;

	public constructor({
		documentChunkModel,
		extractionResponseModel,
		extractionRunModel,
	}: {
		documentChunkModel: typeof DocumentChunkModel;
		extractionResponseModel: typeof ExtractionResponseModel;
		extractionRunModel: typeof ExtractionRunModel;
	}) {
		this.documentChunkModel = documentChunkModel;
		this.extractionResponseModel = extractionResponseModel;
		this.extractionRunModel = extractionRunModel;
	}

	public async create({
		documentId,
		processingAttempt,
	}: {
		documentId: number;
		processingAttempt: number;
	}): Promise<number> {
		const run = await this.extractionRunModel
			.query()
			.insert({
				documentId,
				processingAttempt,
				status: ExtractionRunStatus.RUNNING,
			})
			.returning("id")
			.execute();

		return run.id;
	}

	public async createChunks({
		chunks,
		extractionRunId,
	}: {
		chunks: NewDocumentChunk[];
		extractionRunId: number;
	}): Promise<Map<number, number>> {
		if (chunks.length === EMPTY_LENGTH) {
			return new Map();
		}

		const saved = await this.documentChunkModel
			.query()
			.insert(chunks.map((chunk) => ({ ...chunk, extractionRunId })))
			.returning(["id", "position"])
			.execute();

		await this.extractionRunModel
			.query()
			.patch({ chunkCount: chunks.length })
			.where({ id: extractionRunId })
			.execute();

		return new Map(saved.map(({ id, position }) => [position, id]));
	}

	public async createResponse(response: NewExtractionResponse): Promise<void> {
		await this.extractionResponseModel.query().insert(response).execute();
	}

	public async finish({
		id,
		status,
	}: {
		id: number;
		status: ValueOf<typeof ExtractionRunStatus>;
	}): Promise<void> {
		await this.extractionRunModel
			.query()
			.patch({ status })
			.where({ id })
			.execute();
	}

	public async updateTranslations(
		translations: { id: number; translatedContent: string }[],
	): Promise<void> {
		await Promise.all(
			translations.map(({ id, translatedContent }) =>
				this.documentChunkModel
					.query()
					.patch({ translatedContent })
					.where({ id })
					.execute(),
			),
		);
	}
}

export { ExtractionRunRepository };
