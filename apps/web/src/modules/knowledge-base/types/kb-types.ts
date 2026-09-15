import { type PartialBlock } from "@blocknote/core";

interface KbEntry {
	content: PartialBlock[] | string;
	createdAt?: string;
	id: string;
	title: string;
	updatedAt?: string;
	version: number;
}

interface UpdateKbEntryPayload {
	content: string;
	title: string;
	version: number;
}

export type { KbEntry, UpdateKbEntryPayload };
