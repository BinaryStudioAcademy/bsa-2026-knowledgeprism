import { type JSX } from "react";

import { Icon } from "~/components/components.js";

type Properties = {
	branchName?: string;
	projectName: string;
};

const DestinationBadge = ({
	branchName = "Main",
	projectName,
}: Properties): JSX.Element => (
	<div className="flex items-center gap-2 text-xs text-text-muted">
		<span>Destination</span>
		<span className="inline-flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-text">
			<span>{projectName}</span>
			<Icon name="chevron-filled-right" size={9} />
			<span>{branchName}</span>
		</span>
	</div>
);

export { DestinationBadge };
