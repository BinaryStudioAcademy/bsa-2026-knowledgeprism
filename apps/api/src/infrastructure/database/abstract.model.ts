import { Model } from "objection";

class Abstract extends Model {
	public createdAt!: Date;

	public id!: number;

	public updatedAt!: Date;

	public override $beforeInsert(): void {
		const insertDate = new Date();

		this.createdAt = insertDate;
		this.updatedAt = insertDate;
	}

	public override $beforeUpdate(): void {
		this.updatedAt = new Date();
	}
}

export { Abstract };
