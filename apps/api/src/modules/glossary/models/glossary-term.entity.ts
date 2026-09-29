import { type EmbeddingVector } from "@knowledgeprism/worker";

import { type Entity } from "~/shared/types/types.js";

type GlossaryTermDetails = {
	createdAt: string;
	definition: string;
	id: number;
	name: string;
	projectId: number;
	updatedAt: string;
};

class GlossaryTermEntity implements Entity {
	private createdAt: Date;
	private definition: string;
	private embedding: EmbeddingVector | null;
	private id: null | number;
	private name: string;
	private projectId: number;
	private updatedAt: Date;

	private constructor({
		createdAt,
		definition,
		embedding,
		id,
		name,
		projectId,
		updatedAt,
	}: {
		createdAt?: Date;
		definition: string;
		embedding: EmbeddingVector | null;
		id: null | number;
		name: string;
		projectId: number;
		updatedAt?: Date;
	}) {
		this.id = id;
		this.projectId = projectId;
		this.name = name;
		this.definition = definition;
		this.embedding = embedding;
		this.createdAt = createdAt ?? new Date();
		this.updatedAt = updatedAt ?? new Date();
	}

	public static initialize(data: {
		createdAt: Date;
		definition: string;
		embedding: EmbeddingVector | null;
		id: number;
		name: string;
		projectId: number;
		updatedAt: Date;
	}): GlossaryTermEntity {
		return new GlossaryTermEntity(data);
	}

	public static initializeNew({
		definition,
		embedding,
		name,
		projectId,
	}: {
		definition: string;
		embedding: EmbeddingVector;
		name: string;
		projectId: number;
	}): GlossaryTermEntity {
		return new GlossaryTermEntity({
			definition,
			embedding,
			id: null,
			name,
			projectId,
		});
	}

	public getEmbedding(): EmbeddingVector | null {
		return this.embedding;
	}

	public toNewObject(): {
		definition: string;
		embedding: EmbeddingVector;
		name: string;
		projectId: number;
	} {
		return {
			definition: this.definition,
			embedding: this.embedding as EmbeddingVector,
			name: this.name,
			projectId: this.projectId,
		};
	}

	public toObject(): GlossaryTermDetails {
		return {
			createdAt: this.createdAt.toISOString(),
			definition: this.definition,
			id: this.id as number,
			name: this.name,
			projectId: this.projectId,
			updatedAt: this.updatedAt.toISOString(),
		};
	}
}

export { GlossaryTermEntity };
