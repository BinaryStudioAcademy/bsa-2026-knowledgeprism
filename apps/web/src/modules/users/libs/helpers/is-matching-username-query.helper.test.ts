import { describe, expect, it } from "vitest";

import { isMatchingUsernameQuery } from "./is-matching-username-query.helper.js";

const BLANK_QUERY_LENGTH = 3;

const ADA = { firstName: "Ada", lastName: "Lovelace" };
const GRACE = { firstName: "Grace", lastName: "Hopper" };
const NG = { firstName: "Kim", lastName: "Ng" };

describe("isMatchingUsernameQuery", () => {
	it("keeps every user when the query is blank", () => {
		expect(isMatchingUsernameQuery(ADA, " ".repeat(BLANK_QUERY_LENGTH))).toBe(
			true,
		);
	});

	it("matches a first or last name without caring about case", () => {
		expect(isMatchingUsernameQuery(ADA, "ada")).toBe(true);
		expect(isMatchingUsernameQuery(ADA, "LOVELACE")).toBe(true);
		expect(isMatchingUsernameQuery(ADA, "ada love")).toBe(true);
	});

	it("does not match a different person", () => {
		expect(isMatchingUsernameQuery(GRACE, "ada")).toBe(false);
	});

	it("keeps the existing list order", () => {
		const users = [GRACE, NG, ADA];

		expect(
			users.filter((user) => {
				return isMatchingUsernameQuery(user, "a");
			}),
		).toEqual([GRACE, ADA]);
	});

	it("matches a name when one part is missing", () => {
		expect(
			isMatchingUsernameQuery({ firstName: null, lastName: "Ng" }, "ng"),
		).toBe(true);
	});
});
