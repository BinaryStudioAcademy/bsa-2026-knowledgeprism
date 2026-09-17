import { DocumentStatus } from "@knowledgeprism/constants";
import { useCallback, useState } from "react";

import { type ValueOf } from "~/lib/types/types.js";

type ProcessingState = {
	currentStatus: ValueOf<typeof DocumentStatus>;
	error: boolean;
	initiatorUserId: null | string;
	isProcessing: boolean;
};

const useKnowledgeProcessing = (currentUserId: string) => {
	const [state, setState] = useState<ProcessingState>({
		currentStatus: DocumentStatus.UPLOADED,
		error: false,
		initiatorUserId: null,
		isProcessing: false,
	});

	const startProcessing = useCallback((): void => {
		setState({
			currentStatus: DocumentStatus.UPLOADED,
			error: false,
			initiatorUserId: currentUserId,
			isProcessing: true,
		});
	}, [currentUserId]);

	const retryProcessing = useCallback((): void => {
		setState((previous) => ({
			...previous,
			currentStatus: DocumentStatus.UPLOADED,
			error: false,
			isProcessing: true,
		}));
	}, []);

	const cancelProcessing = useCallback((): void => {
		setState({
			currentStatus: DocumentStatus.UPLOADED,
			error: false,
			initiatorUserId: null,
			isProcessing: false,
		});
	}, []);

	const isInitiator = state.initiatorUserId === currentUserId;

	return {
		cancelProcessing,
		isInitiator,
		retryProcessing,
		startProcessing,
		state,
	};
};

export { useKnowledgeProcessing };
