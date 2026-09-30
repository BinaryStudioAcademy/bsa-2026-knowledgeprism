import { describe, expect, it } from "vitest";

import { toGlossaryTermName } from "./to-glossary-term-name.helper.js";

describe("toGlossaryTermName", () => {
	it("removes a leading article from the flagged text", () => {
		expect(toGlossaryTermName("the customer")).toBe("customer");
		expect(toGlossaryTermName("An Order ")).toBe("Order");
	});

	it("keeps text without a leading article", () => {
		expect(toGlossaryTermName("theme settings")).toBe("theme settings");
	});
});
