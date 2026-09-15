import { type ProjectMemberRole } from "@knowledgeprism/constants";

type ProjectMemberResponseDto = {
	email: string;
	firstName: null | string;
	lastName: null | string;
	role:
		| typeof ProjectMemberRole.ADMIN
		| typeof ProjectMemberRole.EDITOR
		| typeof ProjectMemberRole.VIEWER;
	status: "active" | "inactive";
	userId: number;
};

export { type ProjectMemberResponseDto };
