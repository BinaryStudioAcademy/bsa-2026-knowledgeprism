import {
	type KnowledgeState,
	type PipelineSessionScope,
} from "../types/types.js";

const isMatchingPipelineSession = (
	{
		pipelineProjectId,
		pipelineSessionId,
	}: Pick<KnowledgeState, "pipelineProjectId" | "pipelineSessionId">,
	scope: PipelineSessionScope,
): boolean => {
	return (
		pipelineProjectId === scope.projectId &&
		pipelineSessionId === scope.pipelineSessionId
	);
};

export { isMatchingPipelineSession };
