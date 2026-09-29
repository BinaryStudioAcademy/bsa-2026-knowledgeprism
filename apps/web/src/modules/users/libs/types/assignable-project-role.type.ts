import { type ProjectMemberRole } from "@knowledgeprism/constants";

type AssignableProjectRole =
	typeof ProjectMemberRole.EDITOR | typeof ProjectMemberRole.VIEWER;

export { type AssignableProjectRole };
