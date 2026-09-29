import { describe, expect, it } from "vitest";

import {
	buildUserManagementPath,
	resolveSelectedProjectId,
} from "./user-management-project.helper.js";

const PROJECT_ID = "project-1";
const OTHER_PROJECT_ID = "project-2";

describe("user management project scope", () => {
	it("ignores the saved project on the workspace list", () => {
		expect(
			resolveSelectedProjectId({
				fallbackProjectId: PROJECT_ID,
				pathname: "/workspaces",
				search: "",
			}),
		).toBeNull();
	});

	it("opens organisation user management without a project query", () => {
		expect(
			resolveSelectedProjectId({
				fallbackProjectId: PROJECT_ID,
				pathname: "/users",
				search: "",
			}),
		).toBeNull();
		expect(buildUserManagementPath(null)).toBe("/users");
	});

	it("keeps the project named in the user management query", () => {
		expect(
			resolveSelectedProjectId({
				fallbackProjectId: PROJECT_ID,
				pathname: "/users",
				search: `?projectId=${OTHER_PROJECT_ID}`,
			}),
		).toBe(OTHER_PROJECT_ID);
		expect(buildUserManagementPath(OTHER_PROJECT_ID)).toBe(
			`/users?projectId=${OTHER_PROJECT_ID}`,
		);
	});

	it("keeps the saved project inside a project route", () => {
		expect(
			resolveSelectedProjectId({
				fallbackProjectId: PROJECT_ID,
				pathname: `/workspaces/${PROJECT_ID}/knowledge-tree`,
				search: "",
			}),
		).toBe(PROJECT_ID);
	});
});
