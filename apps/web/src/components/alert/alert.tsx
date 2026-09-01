import { type JSX } from "react";

import { getValidClassNames } from "~/lib/helpers/helpers.js";

const alertClassNamesByVariant = {
	error: {
		container: "alert--error",
		indicator: "bg-error",
	},
	success: {
		container: "alert--success",
		indicator: "bg-success",
	},
	warning: {
		container: "alert--warning",
		indicator: "bg-warning",
	},
} as const;

type AlertVariant = keyof typeof alertClassNamesByVariant;

type Properties = {
	description: string;
	title: string;
	variant: AlertVariant;
};

const Alert = ({ description, title, variant }: Properties): JSX.Element => {
	const variantClassNames = alertClassNamesByVariant[variant];

	return (
		<div className={getValidClassNames("alert", variantClassNames.container)}>
			<span
				aria-hidden="true"
				className={getValidClassNames(
					"mt-0.5 size-4 shrink-0 rounded-full",
					variantClassNames.indicator,
				)}
			/>
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
