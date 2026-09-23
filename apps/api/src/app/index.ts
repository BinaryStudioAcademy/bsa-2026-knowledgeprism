import { serverApplication } from "~/infrastructure/server-application/server-application.js";
import { startStaleProcessingSweep } from "~/modules/documents/documents.js";

await serverApplication.init();

startStaleProcessingSweep();
