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
	private id: null | number;
	private name: string;
	private projectId: number;
	private updatedAt: Date;

	private constructor({
		createdAt,
		definition,
		id,
		name,
		projectId,
		updatedAt,
	}: {
		createdAt?: Date;
		definition: string;
		id: null | number;
		name: string;
		projectId: number;
		updatedAt?: Date;
	}) {
		this.id = id;
		this.projectId = projectId;
		this.name = name;
		this.definition = definition;
		this.createdAt = createdAt ?? new Date();
		this.updatedAt = updatedAt ?? new Date();
	}

	public static initialize(data: {
		createdAt: Date;
		definition: string;
		id: number;
		name: string;
		projectId: number;
		updatedAt: Date;
	}): GlossaryTermEntity {
		return new GlossaryTermEntity(data);
	}

	public static initializeNew({
		definition,
		name,
		projectId,
	}: {
		definition: string;
		name: string;
		projectId: number;
	}): GlossaryTermEntity {
		return new GlossaryTermEntity({
			definition,
			id: null,
			name,
			projectId,
		});
	}

	public toNewObject(): {
		definition: string;
		name: string;
		projectId: number;
	} {
		return {
			definition: this.definition,
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
