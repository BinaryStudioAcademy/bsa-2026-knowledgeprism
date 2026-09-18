import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX, useEffect, useState } from "react";

import { type ValueOf } from "~/lib/types/types.js";

import { CompactVariant } from "./libs/components/compact-variant/compact-variant.js";
import { FullVariant } from "./libs/components/full-variant/full-variant.js";
import {
	FULL_PERCENTAGE,
	INITIAL_STATUS_INDEX,
	MOCK_TIMER_DELAY_MS,
	PERCENTAGE_OFFSET,
	STATUS_INDEX_INCREMENT,
	STATUS_PROGRESSION,
} from "./libs/constants.js";
import { type Properties } from "./libs/types.js";

// TODO: Add `currentStatus: ValueOf<typeof DocumentStatus>` passed down from TanStack Query
const LoadingState = (properties: Properties): JSX.Element => {
	const { hasError = false, variant = "full" } = properties;

	// TODO: Delete this mock state and use the `currentStatus` prop from TanStack Query instead
	const [currentStatusIndex, setCurrentStatusIndex] =
		useState(INITIAL_STATUS_INDEX);

	const currentStatus = STATUS_PROGRESSION[currentStatusIndex] as ValueOf<
		typeof DocumentStatus
	>;

	const isError = hasError || currentStatus === DocumentStatus.FAILED;

	// TODO: Delete this entire useEffect mock timer when backend is connected
	useEffect(() => {
		if (isError || currentStatus === DocumentStatus.EXTRACTED) {
			return;
		}

		const timer = setTimeout(() => {
			setCurrentStatusIndex((previous) => previous + STATUS_INDEX_INCREMENT);
		}, MOCK_TIMER_DELAY_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [currentStatus, hasError, isError]);

	// TODO: When mock state is removed, derive percentage by finding the index of `currentStatus` in `STATUS_PROGRESSION`
	const percentage = Math.round(
		(currentStatusIndex / (STATUS_PROGRESSION.length - PERCENTAGE_OFFSET)) *
			FULL_PERCENTAGE,
	);

	const internalProperties = {
		...properties,
		currentStatus,
		isError,
		percentage,
	};

	if (variant === "compact") {
		return <CompactVariant {...internalProperties} />;
	}

	return <FullVariant {...internalProperties} />;
};

export { LoadingState };
