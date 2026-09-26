import { database } from "~/infrastructure/database/database.js";
import { logger } from "~/infrastructure/logger/logger.js";
import { deleteObjectsByPrefix } from "~/infrastructure/s3/delete-objects.js";
import { userService } from "~/modules/users/users.js";

import { ProjectController } from "./controllers/project.controller.js";
import { ProjectMemberModel } from "./models/project-member.model.js";
import { ProjectStorageCleanupModel } from "./models/project-storage-cleanup.model.js";
import { ProjectModel } from "./models/project.model.js";
import { ProjectMemberRepository } from "./repositories/project-member.repository.js";
import { ProjectStorageCleanupRepository } from "./repositories/project-storage-cleanup.repository.js";
import { ProjectRepository } from "./repositories/project.repository.js";
import { ProjectStorageCleanupService } from "./services/project-storage-cleanup.service.js";
import { ProjectService } from "./services/project.service.js";

const projectMemberRepository = new ProjectMemberRepository(ProjectMemberModel);
const projectRepository = new ProjectRepository(ProjectModel);
const projectStorageCleanupRepository = new ProjectStorageCleanupRepository(
	ProjectStorageCleanupModel,
);
const projectStorageCleanupService = new ProjectStorageCleanupService({
	deleteObjectsByPrefix,
	logger,
	projectStorageCleanupRepository,
});
const projectService = new ProjectService({
	database,
	projectMemberRepository,
	projectRepository,
	projectStorageCleanupService,
	userService,
});
const projectController = new ProjectController(logger, projectService);

const startProjectStorageCleanupSweep = (): void => {
	projectStorageCleanupService.startPeriodicSweep();
};

export { projectController, projectService, startProjectStorageCleanupSweep };
