import { OrganisationRole } from "@knowledgeprism/constants";
import { describe, expect, it } from "vitest";

import { selectManagedUsers } from "./select-managed-users.helper.js";

const PROJECT_ONE_ID = 1;
const PROJECT_TWO_ID = 2;
const PROJECT_THREE_ID = 3;
const ADMIN_ID = 10;
const SIGNED_IN_ADMIN_ID = 11;
const PROJECT_ONE_MEMBER_ID = 21;
const PROJECT_TWO_MEMBER_ID = 22;
const BOTH_PROJECTS_MEMBER_ID = 23;
const OUTSIDE_MEMBER_ID = 24;
const UNASSIGNED_MEMBER_ID = 25;

const ADMIN = {
	assignedProjects: [],
	id: ADMIN_ID,
	organisationRole: OrganisationRole.ADMIN,
};
const PROJECT_ONE_MEMBER = {
	assignedProjects: [{ projectId: PROJECT_ONE_ID }],
	id: PROJECT_ONE_MEMBER_ID,
	organisationRole: OrganisationRole.USER,
};
const PROJECT_TWO_MEMBER = {
	assignedProjects: [{ projectId: PROJECT_TWO_ID }],
	id: PROJECT_TWO_MEMBER_ID,
	organisationRole: OrganisationRole.USER,
};
const BOTH_PROJECTS_MEMBER = {
	assignedProjects: [
		{ projectId: PROJECT_ONE_ID },
		{ projectId: PROJECT_TWO_ID },
	],
	id: BOTH_PROJECTS_MEMBER_ID,
	organisationRole: OrganisationRole.USER,
};
const OUTSIDE_MEMBER = {
	assignedProjects: [{ projectId: PROJECT_THREE_ID }],
	id: OUTSIDE_MEMBER_ID,
	organisationRole: OrganisationRole.USER,
};
const UNASSIGNED_MEMBER = {
	assignedProjects: [],
	id: UNASSIGNED_MEMBER_ID,
	organisationRole: OrganisationRole.USER,
};

const USERS = [
	ADMIN,
	PROJECT_ONE_MEMBER,
	OUTSIDE_MEMBER,
	UNASSIGNED_MEMBER,
	BOTH_PROJECTS_MEMBER,
	PROJECT_TWO_MEMBER,
];

const KNOWN_PROJECTS = new Set([
	String(PROJECT_ONE_ID),
	String(PROJECT_TWO_ID),
]);

const BASE_SCOPE = {
	currentUserId: null,
	isCurrentUserOrganisationAdmin: false,
	projectIds: KNOWN_PROJECTS,
	selectedProjectId: null,
};

describe("selectManagedUsers", () => {
	it("shows users on the admin projects and keeps the admin first", () => {
		expect(selectManagedUsers(USERS, BASE_SCOPE)).toEqual([
			ADMIN,
			PROJECT_ONE_MEMBER,
			BOTH_PROJECTS_MEMBER,
			PROJECT_TWO_MEMBER,
		]);
	});

	it("shows only the selected project's members and the admin", () => {
		expect(
			selectManagedUsers(USERS, {
				...BASE_SCOPE,
				selectedProjectId: String(PROJECT_ONE_ID),
			}),
		).toEqual([ADMIN, PROJECT_ONE_MEMBER, BOTH_PROJECTS_MEMBER]);
	});

	it("hides the previous project's members after the selection changes", () => {
		expect(
			selectManagedUsers(USERS, {
				...BASE_SCOPE,
				selectedProjectId: String(PROJECT_TWO_ID),
			}),
		).toEqual([ADMIN, BOTH_PROJECTS_MEMBER, PROJECT_TWO_MEMBER]);
	});

	it("keeps assigned users when the project catalog is still unknown", () => {
		expect(
			selectManagedUsers(USERS, {
				...BASE_SCOPE,
				projectIds: null,
			}),
		).toEqual([
			ADMIN,
			PROJECT_ONE_MEMBER,
			OUTSIDE_MEMBER,
			BOTH_PROJECTS_MEMBER,
			PROJECT_TWO_MEMBER,
		]);
	});

	it("keeps the signed-in admin when the list omits their role", () => {
		const signedInAdmin = {
			assignedProjects: [],
			id: SIGNED_IN_ADMIN_ID,
			organisationRole: null,
		};

		expect(
			selectManagedUsers([signedInAdmin, UNASSIGNED_MEMBER], {
				...BASE_SCOPE,
				currentUserId: SIGNED_IN_ADMIN_ID,
				isCurrentUserOrganisationAdmin: true,
				projectIds: KNOWN_PROJECTS,
			}),
		).toEqual([signedInAdmin, UNASSIGNED_MEMBER]);
	});
});
