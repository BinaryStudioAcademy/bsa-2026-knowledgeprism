import { logger } from "~/infrastructure/logger/logger.js";
import { userService } from "~/modules/users/users.js";

import { ProjectController } from "./controllers/project.controller.js";
import { ProjectMemberModel } from "./models/project-member.model.js";
import { ProjectModel } from "./models/project.model.js";
import { ProjectMemberRepository } from "./repositories/project-member.repository.js";
import { ProjectRepository } from "./repositories/project.repository.js";
import { ProjectService } from "./services/project.service.js";

const projectMemberRepository = new ProjectMemberRepository(ProjectMemberModel);
const projectRepository = new ProjectRepository(ProjectModel);
const projectService = new ProjectService({
	projectMemberRepository,
	projectRepository,
	userService,
});
const projectController = new ProjectController(logger, projectService);

export { projectController };
