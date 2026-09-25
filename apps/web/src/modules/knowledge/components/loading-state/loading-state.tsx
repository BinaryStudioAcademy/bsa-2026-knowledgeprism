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
	HALF_PERCENTAGE,
	LOADING_FINISH_DELAY_MS,
	PERCENTAGE_OFFSET,
} from "./libs/constants.js";
import { type Properties } from "./libs/types.js";

const LoadingState = (properties: Properties): JSX.Element => {
	const { currentStatus, hasError = false, variant = "full" } = properties;

	const isError = hasError || currentStatus === DocumentStatus.FAILED;
	const isTerminal = (
		[
			DocumentStatus.WAITING_FOR_VALIDATION,
			DocumentStatus.WAITING_FOR_APPROVAL,
			DocumentStatus.FAILED,
		] as ValueOf<typeof DocumentStatus>[]
	).includes(currentStatus as ValueOf<typeof DocumentStatus>);

	const onFinish = "onFinish" in properties ? properties.onFinish : undefined;

	useEffect(() => {
		const isReadyToFinish = (
			[
				DocumentStatus.WAITING_FOR_VALIDATION,
				DocumentStatus.WAITING_FOR_APPROVAL,
			] as ValueOf<typeof DocumentStatus>[]
		).includes(currentStatus as ValueOf<typeof DocumentStatus>);

		if (!isTerminal || !onFinish || !isReadyToFinish) {
			return;
		}

		const timer = setTimeout(() => {
			onFinish();
		}, LOADING_FINISH_DELAY_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [isTerminal, currentStatus, onFinish]);

	const isIntegrationPhase =
		currentStatus === DocumentStatus.INTEGRATING ||
		currentStatus === DocumentStatus.WAITING_FOR_APPROVAL;

	let percentage: number;

	if (isIntegrationPhase) {
		percentage =
			currentStatus === DocumentStatus.WAITING_FOR_APPROVAL
				? FULL_PERCENTAGE
				: HALF_PERCENTAGE;
	} else {
		const extractionStatuses: ValueOf<typeof DocumentStatus>[] = [
			DocumentStatus.UPLOADED,
			DocumentStatus.PROCESSING,
			DocumentStatus.WAITING_FOR_VALIDATION,
		];
		const index = extractionStatuses.indexOf(
			currentStatus as ValueOf<typeof DocumentStatus>,
		);
		const effectiveIndex = index === NOT_FOUND_INDEX ? START_INDEX : index;
		percentage = Math.round(
			(effectiveIndex / (extractionStatuses.length - PERCENTAGE_OFFSET)) *
				FULL_PERCENTAGE,
		);
	}

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
