import { type ProjectMemberRole } from "@knowledgeprism/constants";

type ProjectGetAllItemResponseDto = {
	description: null | string;
	id: number;
	lastActivityAt: string;
	name: string;
	role:
		| typeof ProjectMemberRole.ADMIN
		| typeof ProjectMemberRole.EDITOR
		| typeof ProjectMemberRole.VIEWER;
};

export { type ProjectGetAllItemResponseDto };
