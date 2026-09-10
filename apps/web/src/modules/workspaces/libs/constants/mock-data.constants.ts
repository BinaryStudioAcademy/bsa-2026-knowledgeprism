import { type ProjectItem } from "~/modules/workspaces/types/types.js";

const MOCK_PROJECTS: ProjectItem[] = [
	{
		description:
			"Hardware specifications, thermal management protocols, and display calibration data for next-gen.",
		id: "1",
		name: "iPhone Engineering",
		role: "ADMIN",
		updatedAt: "2026-09-03T13:55:00.000Z",
	},
	{
		description:
			"Window tiling documentation, Continuity features, and kernel extension deprecation notices.",
		id: "2",
		name: "macOS Sequoia",
		role: "VIEWER",
		updatedAt: "2026-08-31T10:00:00.000Z",
	},
	{
		description:
			"Human Interface Guidelines, dynamic island animations, and widget state management.",
		id: "3",
		name: "iOS UI Kit",
		role: "EDITOR",
		updatedAt: "2026-08-27T10:00:00.000Z",
	},
];

export { MOCK_PROJECTS };
