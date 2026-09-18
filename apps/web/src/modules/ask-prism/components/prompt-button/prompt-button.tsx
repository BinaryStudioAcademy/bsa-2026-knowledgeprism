import { type JSX, useCallback } from "react";

type Properties = {
	isDisabled?: boolean;
	onClick: (prompt: string) => void;
	prompt: string;
};

const PromptButton = ({
	isDisabled = false,
	onClick,
	prompt,
}: Properties): JSX.Element => {
	const handleClick = useCallback((): void => {
		onClick(prompt);
	}, [onClick, prompt]);

	return (
		<button
			className="max-w-[220px] cursor-pointer truncate rounded-md border border-border bg-surface px-2.5 py-1 font-sans text-xs text-text-muted shadow-2xs transition-all duration-200 hover:scale-[1.02] hover:border-accent hover:bg-success-bg/40 hover:text-accent active:scale-95 disabled:pointer-events-none disabled:opacity-50"
			disabled={isDisabled}
			onClick={handleClick}
			title={prompt}
			type="button"
		>
			{prompt}
		</button>
	);
};

export { PromptButton };
