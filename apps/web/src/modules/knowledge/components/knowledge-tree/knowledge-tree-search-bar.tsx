import React from "react";

import { Icon } from "~/components/icon/icon.js";

type Properties = {
	onChange: (event_: React.ChangeEvent<HTMLInputElement>) => void;
	value: string;
};

const KnowledgeTreeSearchBar: React.FC<Properties> = ({
	onChange,
	value,
}: Properties) => {
	return (
		<div className="px-3 pb-3">
			<div className="relative w-full">
				<input
					aria-label="Search knowledge base"
					className="block h-9 w-full appearance-none rounded-md border border-border bg-surface pl-8 pr-3 text-sm text-text outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/15"
					onChange={onChange}
					placeholder="Search knowledge base..."
					type="text"
					value={value}
				/>
				<div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
					<Icon name="search" size={14} />
				</div>
			</div>
		</div>
	);
};

export { KnowledgeTreeSearchBar };
