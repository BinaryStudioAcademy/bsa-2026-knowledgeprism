interface KbEntry {
	content: string;
	id: string;
	title: string;
}

interface UpdateKbEntryPayload {
	content: string;
	title: string;
}

export { KbEntry, UpdateKbEntryPayload };
