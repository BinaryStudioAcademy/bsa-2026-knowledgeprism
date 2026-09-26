import { serverApplication } from "~/infrastructure/server-application/server-application.js";
import { startStaleProcessingSweep } from "~/modules/documents/documents.js";
import { startProjectStorageCleanupSweep } from "~/modules/projects/projects.js";

await serverApplication.init();

startStaleProcessingSweep();
startProjectStorageCleanupSweep();
