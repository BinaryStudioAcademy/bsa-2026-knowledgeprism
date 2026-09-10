import { type ProjectAssignmentDto } from "./project-assignment-dto.type.js";

type UserGetAllItemResponseDto = {
	assignedProjects: ProjectAssignmentDto[];
	email: string;
	firstName: null | string;
	id: number;
	lastName: null | string;
	status: "active" | "inactive";
};

export { type UserGetAllItemResponseDto };
