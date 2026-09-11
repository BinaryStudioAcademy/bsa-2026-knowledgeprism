import { type ProjectAssignmentDto } from "./project-assignment-dto.type.js";

type UserCreateRequestDto = {
	assignedProjects: ProjectAssignmentDto[];
	email: string;
	firstName: string;
	lastName: string;
	password: string;
};

export { type UserCreateRequestDto };
