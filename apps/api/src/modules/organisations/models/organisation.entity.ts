import { type Entity } from "~/shared/types/types.js";

class OrganisationEntity implements Entity {
	private id: null | number;

	private name: string;

	private constructor({ id, name }: { id: null | number; name: string }) {
		this.id = id;
		this.name = name;
	}

	public static initialize({
		id,
		name,
	}: {
		id: number;
		name: string;
	}): OrganisationEntity {
		return new OrganisationEntity({
			id,
			name,
		});
	}

	public static initializeNew({ name }: { name: string }): OrganisationEntity {
		return new OrganisationEntity({
			id: null,
			name,
		});
	}

	public toNewObject(): {
		name: string;
	} {
		return {
			name: this.name,
		};
	}

	public toObject(): {
		id: number;
		name: string;
	} {
		return {
			id: this.id as number,
			name: this.name,
		};
	}
}

export { OrganisationEntity };
