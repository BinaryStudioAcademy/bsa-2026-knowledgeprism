import { type ProjectAssignmentDto } from "./project-assignment-dto.type.js";

type UserDetailsResponseDto = {
	assignedProjects: ProjectAssignmentDto[];
	email: string;
	firstName: string | null;
	id: number;
	lastName: string | null;
	status: "active" | "inactive";
};

export { type UserDetailsResponseDto };
