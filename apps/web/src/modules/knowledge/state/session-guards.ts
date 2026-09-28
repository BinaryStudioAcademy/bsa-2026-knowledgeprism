import { store } from "~/lib/store/store.js";

import { type KnowledgeState } from "../libs/types/types.js";

const getKnowledgeState = (): KnowledgeState =>
	store.instance.getState().knowledge;

const getPipelineSessionId = (): number =>
	getKnowledgeState().pipelineSessionId;

const isPipelineSessionCurrent = (pipelineSessionId: number): boolean => {
	const { pipelineProjectId, pipelineSessionId: currentSessionId } =
		getKnowledgeState();

	return pipelineProjectId !== null && currentSessionId === pipelineSessionId;
};

const isUploadSessionCurrent = (uploadSessionId: number): boolean =>
	getKnowledgeState().uploadSession?.id === uploadSessionId;

export {
	getPipelineSessionId,
	isPipelineSessionCurrent,
	isUploadSessionCurrent,
};
