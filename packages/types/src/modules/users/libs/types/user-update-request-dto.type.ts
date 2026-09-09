import { type ProjectAssignmentDto } from "./project-assignment-dto.type.js";

type UserUpdateRequestDto = {
	assignedProjects?: ProjectAssignmentDto[];
	email?: string;
	firstName?: string;
	lastName?: string;
	password?: string;
	status?: "active" | "inactive";
};

export { type UserUpdateRequestDto };
