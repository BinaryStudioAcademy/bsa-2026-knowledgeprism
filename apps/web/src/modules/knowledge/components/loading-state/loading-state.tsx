import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX, useEffect } from "react";

import { type ValueOf } from "~/lib/types/types.js";

import {
	NOT_FOUND_INDEX,
	START_INDEX,
} from "../../libs/constants/constants.js";
import { CompactVariant } from "./libs/components/compact-variant/compact-variant.js";
import { FullVariant } from "./libs/components/full-variant/full-variant.js";
import {
	FULL_PERCENTAGE,
	LOADING_FINISH_DELAY_MS,
	PERCENTAGE_OFFSET,
	STATUS_PROGRESSION,
} from "./libs/constants.js";
import { type Properties } from "./libs/types.js";

const LoadingState = (properties: Properties): JSX.Element => {
	const { currentStatus, hasError = false, variant = "full" } = properties;

	const isError = hasError || currentStatus === DocumentStatus.FAILED;
	const isTerminal =
		currentStatus === DocumentStatus.WAITING_FOR_VALIDATION ||
		currentStatus === DocumentStatus.FAILED;

	const onFinish = "onFinish" in properties ? properties.onFinish : undefined;

	useEffect(() => {
		if (
			!isTerminal ||
			!onFinish ||
			currentStatus !== DocumentStatus.WAITING_FOR_VALIDATION
		) {
			return;
		}

		const timer = setTimeout(() => {
			onFinish();
		}, LOADING_FINISH_DELAY_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [isTerminal, currentStatus, onFinish]);

	const statusIndex = STATUS_PROGRESSION.indexOf(
		currentStatus as ValueOf<typeof DocumentStatus>,
	);
	const effectiveIndex =
		statusIndex === NOT_FOUND_INDEX ? START_INDEX : statusIndex;

	const percentage = Math.round(
		(effectiveIndex / (STATUS_PROGRESSION.length - PERCENTAGE_OFFSET)) *
			FULL_PERCENTAGE,
	);

	const internalProperties = {
		...properties,
		currentStatus: currentStatus as ValueOf<typeof DocumentStatus>,
		isError,
		percentage,
	};

	if (variant === "compact") {
		return <CompactVariant {...internalProperties} />;
	}

	return <FullVariant {...internalProperties} />;
};

export { LoadingState };
