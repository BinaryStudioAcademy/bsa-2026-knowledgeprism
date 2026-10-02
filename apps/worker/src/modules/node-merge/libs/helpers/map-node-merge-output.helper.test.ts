import { type ExtractionContentBlock } from "@knowledgeprism/types";
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { mapNodeMergeOutput } from "./map-node-merge-output.helper.js";

const toBlock = (
	text: string,
	type: ExtractionContentBlock["type"] = "paragraph",
): ExtractionContentBlock => ({ content: [{ text, type: "text" }], type });

const ADMIN_SCOPE = toBlock(
	"Admins can manage every project in the organisation.",
);
const CREATE_PROJECTS = toBlock("Create projects", "bulletListItem");
const INVITE_USERS = toBlock("Invite users", "bulletListItem");
const ARCHIVE_PROJECTS = toBlock("Archive projects", "bulletListItem");
const LONG_SESSIONS = toBlock(
	"Sessions expire after 30 minutes of inactivity.",
);
const SHORT_SESSIONS = toBlock(
	"Sessions expire after 15 minutes of inactivity.",
);

const SOURCE = [
	ADMIN_SCOPE,
	CREATE_PROJECTS,
	INVITE_USERS,
	LONG_SESSIONS,
	INVITE_USERS,
	ARCHIVE_PROJECTS,
	SHORT_SESSIONS,
];

const toRaw = (blocks: ExtractionContentBlock[]): string =>
	JSON.stringify({ blocks });

void describe("mapNodeMergeOutput", () => {
	void it("accepts a merge that keeps repeated list items once", () => {
		const merged = [
			ADMIN_SCOPE,
			CREATE_PROJECTS,
			INVITE_USERS,
			ARCHIVE_PROJECTS,
			LONG_SESSIONS,
			SHORT_SESSIONS,
		];

		assert.deepEqual(mapNodeMergeOutput(toRaw(merged), SOURCE).blocks, merged);
	});

	void it("accepts a merge that keeps both sides of a contradiction", () => {
		const merged = [ADMIN_SCOPE, LONG_SESSIONS, SHORT_SESSIONS];
		const lists = [CREATE_PROJECTS, INVITE_USERS, ARCHIVE_PROJECTS];

		assert.deepEqual(
			mapNodeMergeOutput(toRaw([...merged, ...lists]), SOURCE).blocks,
			[...merged, ...lists],
		);
	});

	void it("rejects a merge that loses facts", () => {
		const merged = [ADMIN_SCOPE, ARCHIVE_PROJECTS];

		assert.equal(mapNodeMergeOutput(toRaw(merged), SOURCE).blocks, null);
	});

	void it("rejects a merge that invents text", () => {
		const merged = [
			...SOURCE,
			toBlock("Billing is handled by the finance team every quarter."),
		];

		assert.equal(mapNodeMergeOutput(toRaw(merged), SOURCE).blocks, null);
	});

	void it("rejects output that is not valid JSON", () => {
		assert.equal(mapNodeMergeOutput("not json", SOURCE).blocks, null);
	});
});
