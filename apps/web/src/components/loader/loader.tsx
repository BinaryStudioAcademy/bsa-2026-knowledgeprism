import { type JSX } from "react";
import { type VariantProps, tv } from "tailwind-variants";

const loaderStyles = tv({
	slots: {
		overlay:
			"bg-bg/80 absolute inset-0 z-50 flex items-center justify-center backdrop-blur-xs",
		spinner:
			"inline-block animate-spin rounded-full border-solid border-accent border-t-transparent",
	},
	variants: {
		size: {
			lg: { spinner: "size-10 border-4" },
			md: { spinner: "size-6 border-3" },
			sm: { spinner: "size-3.5 border-2" },
		},
	},
	defaultVariants: {
		size: "sm",
	},
});

type LoaderVariants = VariantProps<typeof loaderStyles>;

type Properties = LoaderVariants & {
	hasOverlay?: boolean;
};

type SpinnerProperties = LoaderVariants;

const Spinner = ({ size }: SpinnerProperties): JSX.Element => {
	const { spinner } = loaderStyles({ size });

	return (
		<span aria-label="Loading" className={spinner()} role="status">
			<span className="sr-only">Loading...</span>
		</span>
	);
};

const Loader = ({ hasOverlay = false, size }: Properties): JSX.Element => {
	if (hasOverlay) {
		const { overlay } = loaderStyles({ size });

		return (
			<div className={overlay()}>
				<Spinner size={size} />
			</div>
		);
	}

	return <Spinner size={size} />;
};

export { Loader };
