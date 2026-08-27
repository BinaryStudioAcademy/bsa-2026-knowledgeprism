import { type JSX } from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";

type Properties = {
	hasOverlay?: boolean;
	size?: Size;
};

type Size = "lg" | "md" | "sm";

type SpinnerProperties = {
	size?: Size;
};

const sizeToStyle = {
	lg: "size-10 border-4",
	md: "size-6 border-4",
	sm: "size-4 border-2",
} as const;

const Spinner = ({ size = "sm" }: SpinnerProperties): JSX.Element => {
	return (
		<span
			aria-label="Loading"
			className={getValidClassNames(
				"inline-block animate-spin rounded-full border-solid border-accent border-t-transparent",
				sizeToStyle[size],
			)}
			role="status"
		>
			<span className="sr-only">Loading...</span>
		</span>
	);
};

const Loader = ({
	hasOverlay = false,
	size = "sm",
}: Properties): JSX.Element => {
	if (hasOverlay) {
		return (
			<div className="bg-bg/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs">
				<Spinner size={size} />
			</div>
		);
	}

	return <Spinner size={size} />;
};

export { Loader };
