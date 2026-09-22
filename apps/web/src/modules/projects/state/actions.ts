import { type ProjectGetAllResponseDto } from "@knowledgeprism/types";

import { createAppAsyncThunk } from "~/lib/store/store.module.js";

const loadAllProjects = createAppAsyncThunk<
	ProjectGetAllResponseDto,
	undefined
>("projects/load-all", (_, { extra }) => {
	const { projectsApi } = extra;

	return projectsApi.getAll();
});

export { loadAllProjects };
