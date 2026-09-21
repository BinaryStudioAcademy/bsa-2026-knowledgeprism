import { type ProjectMemberRole } from "@knowledgeprism/constants";

type ProjectMemberCreateRequestDto = {
	role: typeof ProjectMemberRole.EDITOR | typeof ProjectMemberRole.VIEWER;
	userId: number;
};

export { type ProjectMemberCreateRequestDto };
