import React from "react";

type Properties = {
	hasOverlay?: boolean;
	size?: "lg" | "md" | "sm";
};

const SIZE_STYLES = {
	lg: "size-10 border-4",
	md: "size-6 border-3",
	sm: "size-3.5 border-2",
} as const;

const Loader = ({
	hasOverlay = false,
	size = "sm",
}: Properties): React.JSX.Element => {
	const spinner = (
		<span
			role="status"
			aria-label="Loading"
			className={`inline-block animate-spin rounded-full border-solid border-accent border-t-transparent ${SIZE_STYLES[size]}`}
		>
			<span className="sr-only">Loading...</span>
		</span>
	);

	if (hasOverlay) {
		return (
			<div className="absolute inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-xs">
				{spinner}
			</div>
		);
	}

	return spinner;
};

export { Loader };
