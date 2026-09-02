import { type JSX } from "react";
import { tv, type VariantProps } from "tailwind-variants";

const alertStyles = tv({
	slots: {
		base: "alert",
		indicator: "mt-0.5 size-4 shrink-0 rounded-full",
	},
	variants: {
		variant: {
			error: {
				base: "alert--error",
				indicator: "bg-error",
			},
			success: {
				base: "alert--success",
				indicator: "bg-success",
			},
			warning: {
				base: "alert--warning",
				indicator: "bg-warning",
			},
		},
	},
});

type Properties = VariantProps<typeof alertStyles> & {
	description: string;
	title: string;
	variant: "error" | "success" | "warning";
};

const Alert = ({ description, title, variant }: Properties): JSX.Element => {
	const { base, indicator } = alertStyles({ variant });

	return (
		<div className={base()}>
			<span aria-hidden="true" className={indicator()} />
			<div className="min-w-0">
				<p className="text-sm font-medium leading-tight text-text">{title}</p>
				<p className="mt-0.5 text-sm leading-tight text-text-muted">
					{description}
				</p>
			</div>
		</div>
	);
};

export { Alert };
