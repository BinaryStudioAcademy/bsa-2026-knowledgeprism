import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX, useEffect } from "react";

import { type ValueOf } from "~/lib/types/types.js";

import { CompactVariant } from "./libs/components/compact-variant/compact-variant.js";
import { FullVariant } from "./libs/components/full-variant/full-variant.js";
import { LOADING_FINISH_DELAY_MS } from "./libs/constants.js";
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

	const internalProperties = {
		...properties,
		currentStatus: currentStatus as ValueOf<typeof DocumentStatus>,
		isError,
	};

	if (variant === "compact") {
		return <CompactVariant {...internalProperties} />;
	}

	return <FullVariant {...internalProperties} />;
};

export { LoadingState };
