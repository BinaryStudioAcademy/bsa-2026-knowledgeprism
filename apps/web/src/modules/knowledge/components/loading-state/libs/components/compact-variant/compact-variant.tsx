import { DocumentStatus } from "@knowledgeprism/constants";
import { type JSX, useEffect, useState } from "react";

import {
	Button,
	Icon,
	Paragraph,
	ParagraphSize,
} from "~/components/components.js";
import { getValidClassNames } from "~/lib/helpers/helpers.js";
import { type ValueOf } from "~/lib/types/types.js";

import { FULL_PERCENTAGE, LOADING_FINISH_DELAY_MS } from "../../constants.js";
import { type InternalVariantProperties } from "../../types.js";

const getCompactStatusText = (
	status: ValueOf<typeof DocumentStatus>,
): string => {
	switch (status) {
		case DocumentStatus.PROCESSING: {
			return "New knowledge is being processed";
		}
		case DocumentStatus.UPLOADED: {
			return "New knowledge is being initialized";
		}
		case DocumentStatus.WAITING_FOR_VALIDATION: {
			return "New knowledge is ready";
		}
		default: {
			return "New knowledge is being processed";
		}
	}
};

const CompactVariant = ({
	currentStatus,
	isError,
	onCancel,
	onPreview,
	onRetry,
	percentage,
}: InternalVariantProperties): JSX.Element => {
	const isReady = currentStatus === DocumentStatus.WAITING_FOR_VALIDATION;
	const [previousIsReady, setPreviousIsReady] = useState<boolean>(isReady);
	const [showButton, setShowButton] = useState<boolean>(false);

	if (isReady !== previousIsReady) {
		setPreviousIsReady(isReady);
		setShowButton(false);
	}

	useEffect(() => {
		if (!isReady) {
			return;
		}

		const timer = setTimeout(() => {
			setShowButton(true);
		}, LOADING_FINISH_DELAY_MS);

		return () => {
			clearTimeout(timer);
		};
	}, [isReady]);

	return (
		<div className="flex w-full min-w-65 flex-col">
			{!showButton && (
				<div className="mb-1 flex w-full flex-col gap-1 @5xl:pr-6">
					<div className="flex min-h-7 items-center justify-between">
						{isError ? (
							<Paragraph
								className="font-medium text-error"
								size={ParagraphSize.BODY_SMALL}
							>
								Processing failed
							</Paragraph>
						) : (
							<>
								<Paragraph size={ParagraphSize.BODY_SMALL}>
									{getCompactStatusText(currentStatus)}
								</Paragraph>
								<Paragraph size={ParagraphSize.BODY_SMALL}>
									{percentage}%
								</Paragraph>
							</>
						)}

						{isError && (
							<div className="flex items-center gap-2">
								<Button
									aria-label="Retry"
									className="size-7 p-0"
									onClick={onRetry}
									variant="icon"
								>
									<Icon name="refresh" size={14} />
								</Button>
								<Button
									aria-label="Cancel"
									className="size-7 p-0"
									onClick={onCancel}
									variant="icon"
								>
									<Icon name="close" size={14} />
								</Button>
							</div>
						)}
					</div>
					<div className="h-1.5 w-full overflow-hidden rounded-full bg-border-subtle">
						<div
							className={getValidClassNames(
								"h-full transition-all duration-300",
								{
									"bg-accent": !isError,
									"bg-error": isError,
								},
							)}
							style={{
								width: `${String(isError ? FULL_PERCENTAGE : percentage)}%`,
							}}
						/>
					</div>
				</div>
			)}

			{showButton && (
				<Button
					className="w-full sm:w-fit sm:self-end"
					onClick={onPreview}
					variant="accent"
				>
					Preview is ready
				</Button>
			)}
		</div>
	);
};

export { CompactVariant };
