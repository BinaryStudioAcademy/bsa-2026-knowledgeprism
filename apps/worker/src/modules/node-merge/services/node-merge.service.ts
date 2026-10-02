import { logger } from "~/logger/logger.js";

import { invokeNodeMerge } from "../libs/helpers/invoke-node-merge.helper.js";
import { mapNodeMergeOutput } from "../libs/helpers/map-node-merge-output.helper.js";
import {
	type NodeMergeParameters,
	type NodeMergeResult,
} from "../libs/types/types.js";

const EMPTY_LENGTH = 0;

const mergeNodeBlocks = async (
	parameters: NodeMergeParameters,
): Promise<NodeMergeResult> => {
	const { existingBlocks, incomingBlocks } = parameters;

	if (
		existingBlocks.length === EMPTY_LENGTH ||
		incomingBlocks.length === EMPTY_LENGTH
	) {
		return { blocks: null, coverage: null };
	}

	try {
		const raw = await invokeNodeMerge(parameters);

		return mapNodeMergeOutput(raw, [...existingBlocks, ...incomingBlocks]);
	} catch (error) {
		logger.warn("Node merge failed.", { error });

		return { blocks: null, coverage: null };
	}
};

export { mergeNodeBlocks };
