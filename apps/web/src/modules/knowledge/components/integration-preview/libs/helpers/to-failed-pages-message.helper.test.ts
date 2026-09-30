import { describe, expect, it } from "vitest";

import { toFailedPagesMessage } from "./to-failed-pages-message.helper.js";

const PAGE_THREE = 3;
const PAGE_SEVEN = 7;

describe("toFailedPagesMessage", () => {
	it("names a single failed page", () => {
		expect(toFailedPagesMessage([PAGE_THREE])).toBe(
			"Page 3 could not be processed, so items from it may be missing.",
		);
	});

	it("lists several failed pages", () => {
		expect(toFailedPagesMessage([PAGE_THREE, PAGE_SEVEN])).toBe(
			"Pages 3, 7 could not be processed, so items from them may be missing.",
		);
	});
});
