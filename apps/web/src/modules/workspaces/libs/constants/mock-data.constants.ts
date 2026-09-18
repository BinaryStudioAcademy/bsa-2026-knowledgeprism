import {
	type ProjectItem,
	type RecentDocumentItem,
} from "~/modules/workspaces/types/types.js";

const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const MILLISECONDS_IN_SECOND = 1000;
const HOURS_IN_DAY = 24;

const TWO = 2;
const ONE = 1;
const THIRTY = 30;

const ONE_HOUR_MS =
	MINUTES_IN_HOUR * SECONDS_IN_MINUTE * MILLISECONDS_IN_SECOND;
const ONE_DAY_MS = HOURS_IN_DAY * ONE_HOUR_MS;

const TWO_HOURS_AGO = TWO * ONE_HOUR_MS;
const ONE_DAY_AGO = ONE * ONE_DAY_MS;
const THIRTY_SECONDS_AGO = THIRTY * MILLISECONDS_IN_SECOND;

const now = Date.now();

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

const MOCK_RECENT_DOCUMENTS: RecentDocumentItem[] = [
	{
		id: "1",
		projectId: "1",
		title: "Camera system",
		updatedAt: new Date(now - TWO_HOURS_AGO).toISOString(),
	},
	{
		id: "2",
		projectId: "1",
		title: "Processor architecture",
		updatedAt: new Date(now - ONE_DAY_AGO).toISOString(),
	},
	{
		id: "3",
		projectId: "2",
		title: "System Architecture V2",
		updatedAt: new Date(now - THIRTY_SECONDS_AGO).toISOString(),
	},
];

export { MOCK_PROJECTS, MOCK_RECENT_DOCUMENTS };
