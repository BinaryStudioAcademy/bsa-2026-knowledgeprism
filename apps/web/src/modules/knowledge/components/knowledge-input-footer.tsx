import { type JSX } from "react";

import { Button, Icon } from "~/components/components.js";

const ACTION_ICON_SIZE = 9;

type Properties = {
	actionLabel?: string;
	formId?: string;
	hasActionIcon?: boolean;
	isActionDisabled: boolean;
	isLoading?: boolean;
	onCancel: () => void;
	onSubmit?: () => void;
	statusMessage: string;
};

const KnowledgeInputFooter = ({
	actionLabel = "Add to Knowledge Tree",
	formId,
	hasActionIcon = true,
	isActionDisabled,
	isLoading = false,
	onCancel,
	onSubmit,
	statusMessage,
}: Properties): JSX.Element => (
	<div className="sticky bottom-0 z-10 -mx-4 -mb-4 mt-6 flex items-center justify-between gap-4 border-t border-border bg-bg px-4 py-4 tablet:-mx-5.5 tablet:-mb-5.5 tablet:px-5.5 desktop:-mx-6.5 desktop:-mb-6.5 desktop:px-6.5">
		<span
			aria-live="polite"
			className="text-xs text-text-muted max-tablet:hidden"
		>
			{statusMessage}
		</span>

		<div className="flex items-center gap-3 max-tablet:w-full">
			<Button
				className="max-tablet:hidden"
				disabled={isLoading}
				onClick={onCancel}
				variant="ghost"
			>
				Cancel
			</Button>

			<Button
				className="max-tablet:flex-1"
				disabled={isActionDisabled}
				form={formId}
				isLoading={isLoading}
				onClick={formId ? undefined : onSubmit}
				type={formId ? "submit" : "button"}
			>
				<span className="inline-flex items-center gap-2">
					{hasActionIcon && !isLoading && (
						<span aria-hidden="true" className="inline-flex">
							<Icon name="add-knowledge" size={ACTION_ICON_SIZE} />
						</span>
					)}
					{actionLabel}
				</span>
			</Button>
		</div>
	</div>
);

export { KnowledgeInputFooter };
