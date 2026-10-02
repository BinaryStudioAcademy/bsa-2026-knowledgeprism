import { KnowledgeValidationRule } from "@knowledgeprism/constants";
import React, { useCallback, useRef } from "react";

import { Icon, Loader } from "~/components/components.js";

type Properties = {
	isSearchingContent?: boolean;
	onChange: (event_: React.ChangeEvent<HTMLInputElement>) => void;
	onClear: () => void;
	value: string;
};

const KnowledgeTreeSearchBar: React.FC<Properties> = ({
	isSearchingContent = false,
	onChange,
	onClear,
	value,
}: Properties) => {
	const inputReference = useRef<HTMLInputElement>(null);

	const handleClear = useCallback(() => {
		onClear();
		inputReference.current?.focus();
	}, [onClear]);

	return (
		<div className="px-3 pb-3 pt-4.5">
			<div className="relative w-full">
				<input
					aria-label="Search knowledge base"
					className="block h-9 w-full appearance-none rounded-md border border-border bg-surface pl-8 pr-8 text-sm text-text outline-none transition focus:border-accent focus:ring-3 focus:ring-accent/15"
					maxLength={KnowledgeValidationRule.QUERY_MAXIMUM_LENGTH}
					onChange={onChange}
					placeholder="Search knowledge base..."
					ref={inputReference}
					type="text"
					value={value}
				/>
				<div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted">
					{isSearchingContent ? (
						<Loader size="sm" />
					) : (
						<Icon name="search" size={14} />
					)}
				</div>
				{value && (
					<button
						aria-label="Clear search"
						className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-sm text-text-muted hover:text-text focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-accent/35"
						onClick={handleClear}
						type="button"
					>
						<Icon name="close" size={14} />
					</button>
				)}
			</div>
		</div>
	);
};

export { KnowledgeTreeSearchBar };
