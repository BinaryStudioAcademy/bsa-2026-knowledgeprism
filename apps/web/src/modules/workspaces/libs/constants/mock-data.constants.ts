import { type DocumentItem, type ProjectItem } from "../../types/types.js";

const MOCK_PROJECTS: ProjectItem[] = [
	{
		description:
			"Hardware specifications, thermal management protocols, and display calibration data for next-gen.",
		id: "1",
		members: ["/avatars/avatar-1.png", "/avatars/avatar-2.png"],
		name: "iPhone Engineering",
		role: "ADMIN",
		updatedAt: "2026-09-03T13:55:00.000Z",
	},
	{
		description:
			"Window tiling documentation, Continuity features, and kernel extension deprecation notices.",
		id: "2",
		members: ["/avatars/avatar-3.png"],
		name: "macOS Sequoia",
		role: "VIEWER",
		updatedAt: "2026-08-31T10:00:00.000Z",
	},
	{
		description:
			"Human Interface Guidelines, dynamic island animations, and widget state management.",
		id: "3",
		members: ["/avatars/avatar-4.png", "/avatars/avatar-5.png"],
		name: "iOS UI Kit",
		role: "EDITOR",
		updatedAt: "2026-08-27T10:00:00.000Z",
	},
];

const MOCK_DOCUMENTS: DocumentItem[] = [
	{ id: "1", title: "Camera system", updatedAt: "2h ago" },
	{ id: "2", title: "Processor architecture", updatedAt: "1d ago" },
	{ id: "3", title: "System Architecture V2", updatedAt: "Just now" },
];

const FILTER_ROLE_OPTIONS = ["ALL", "ADMIN", "EDITOR", "VIEWER"] as const;

export { FILTER_ROLE_OPTIONS, MOCK_DOCUMENTS, MOCK_PROJECTS };
