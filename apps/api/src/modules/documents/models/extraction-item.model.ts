import { type ExtractionItemStatus } from "@knowledgeprism/constants";
import {
	type ExtractionContentBlock,
	type ValueOf,
} from "@knowledgeprism/types";

import {
	AbstractModel,
	DatabaseTableName,
} from "~/infrastructure/database/database.js";

class ExtractionItemModel extends AbstractModel {
	public blocks!: ExtractionContentBlock[];

	public confidence!: number;

	public documentId!: number;

	public extractionSectionId!: null | number;

	public heading!: null | string;

	public knowledgeNodeId!: null | number;

	public position!: number;

	public rationale!: string;

	public sourceExcerpt!: string;

	public sourcePageNumber!: number;

	public status!: ValueOf<typeof ExtractionItemStatus>;

	public text!: string;

	public title!: string;

	public static override get jsonAttributes(): string[] {
		return ["blocks"];
	}

	public static override get tableName(): string {
		return DatabaseTableName.EXTRACTION_ITEMS;
	}
}

export { ExtractionItemModel };
