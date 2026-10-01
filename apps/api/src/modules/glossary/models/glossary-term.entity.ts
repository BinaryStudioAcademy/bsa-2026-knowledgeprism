import { GlossaryTermOrigin } from "@knowledgeprism/constants";
import { type ValueOf } from "@knowledgeprism/types";
import { type EmbeddingVector } from "@knowledgeprism/worker";

import { type Entity } from "~/shared/types/types.js";

type GlossaryTermDetails = {
	createdAt: string;
	definition: string;
	id: number;
	name: string;
	origin: GlossaryTermOriginValue;
	projectId: number;
	sourceDocumentName: null | string;
	updatedAt: string;
};

type GlossaryTermOriginValue = ValueOf<typeof GlossaryTermOrigin>;

class GlossaryTermEntity implements Entity {
	private createdAt: Date;
	private definition: string;
	private embedding: EmbeddingVector | null;
	private id: null | number;
	private name: string;
	private origin: GlossaryTermOriginValue;
	private projectId: number;
	private sourceDocumentId: null | number;
	private sourceDocumentName: null | string;
	private updatedAt: Date;

	private constructor({
		createdAt,
		definition,
		embedding,
		id,
		name,
		origin,
		projectId,
		sourceDocumentId,
		sourceDocumentName,
		updatedAt,
	}: {
		createdAt?: Date;
		definition: string;
		embedding: EmbeddingVector | null;
		id: null | number;
		name: string;
		origin: GlossaryTermOriginValue;
		projectId: number;
		sourceDocumentId: null | number;
		sourceDocumentName: null | string;
		updatedAt?: Date;
	}) {
		this.id = id;
		this.projectId = projectId;
		this.name = name;
		this.definition = definition;
		this.embedding = embedding;
		this.origin = origin;
		this.sourceDocumentId = sourceDocumentId;
		this.sourceDocumentName = sourceDocumentName;
		this.createdAt = createdAt ?? new Date();
		this.updatedAt = updatedAt ?? new Date();
	}

	public static initialize(data: {
		createdAt: Date;
		definition: string;
		embedding: EmbeddingVector | null;
		id: number;
		name: string;
		origin: GlossaryTermOriginValue;
		projectId: number;
		sourceDocumentId: null | number;
		sourceDocumentName: null | string;
		updatedAt: Date;
	}): GlossaryTermEntity {
		return new GlossaryTermEntity(data);
	}

	public static initializeNew({
		definition,
		embedding,
		name,
		origin = GlossaryTermOrigin.MANUAL,
		projectId,
		sourceDocumentId = null,
	}: {
		definition: string;
		embedding: EmbeddingVector;
		name: string;
		origin?: GlossaryTermOriginValue;
		projectId: number;
		sourceDocumentId?: null | number;
	}): GlossaryTermEntity {
		return new GlossaryTermEntity({
			definition,
			embedding,
			id: null,
			name,
			origin,
			projectId,
			sourceDocumentId,
			sourceDocumentName: null,
		});
	}

	public getEmbedding(): EmbeddingVector | null {
		return this.embedding;
	}

	public toNewObject(): {
		definition: string;
		embedding: EmbeddingVector;
		name: string;
		origin: GlossaryTermOriginValue;
		projectId: number;
		sourceDocumentId: null | number;
	} {
		return {
			definition: this.definition,
			embedding: this.embedding as EmbeddingVector,
			name: this.name,
			origin: this.origin,
			projectId: this.projectId,
			sourceDocumentId: this.sourceDocumentId,
		};
	}

	public toObject(): GlossaryTermDetails {
		return {
			createdAt: this.createdAt.toISOString(),
			definition: this.definition,
			id: this.id as number,
			name: this.name,
			origin: this.origin,
			projectId: this.projectId,
			sourceDocumentName: this.sourceDocumentName,
			updatedAt: this.updatedAt.toISOString(),
		};
	}
}

export { GlossaryTermEntity };
