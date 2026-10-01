import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { compareManagedUsers } from "./compare-managed-users.helper.js";

const NEWER = "2026-09-29T12:00:00.000Z";
const OLDER = "2026-09-28T12:00:00.000Z";

type ManagedUserSortKey = {
	isOrganisationAdmin: boolean;
	updatedAt: string;
};

const sortUsers = (users: ManagedUserSortKey[]): ManagedUserSortKey[] => {
	return users.toSorted(compareManagedUsers);
};

void describe("compareManagedUsers", () => {
	void it("places an organisation admin before a newer member", () => {
		const admin = { isOrganisationAdmin: true, updatedAt: OLDER };
		const member = { isOrganisationAdmin: false, updatedAt: NEWER };

		assert.deepEqual(sortUsers([member, admin]), [admin, member]);
	});

	void it("places the most recently updated member first", () => {
		const newerMember = { isOrganisationAdmin: false, updatedAt: NEWER };
		const olderMember = { isOrganisationAdmin: false, updatedAt: OLDER };

		assert.deepEqual(sortUsers([olderMember, newerMember]), [
			newerMember,
			olderMember,
		]);
	});

	void it("orders admins by the same recent activity", () => {
		const newerAdmin = { isOrganisationAdmin: true, updatedAt: NEWER };
		const olderAdmin = { isOrganisationAdmin: true, updatedAt: OLDER };

		assert.deepEqual(sortUsers([olderAdmin, newerAdmin]), [
			newerAdmin,
			olderAdmin,
		]);
	});
});
