import React, { useCallback } from "react";

import { type DocumentItem } from "../types/types.js";

interface RecentDocumentsProperties {
	documents: DocumentItem[];
	onSelect?: (id: string) => void;
}

const RecentDocuments: React.FC<RecentDocumentsProperties> = ({
	documents,
	onSelect,
}) => {
	const handleSelect = useCallback(
		(id: string) => () => {
			onSelect?.(id);
		},
		[onSelect],
	);

	return (
		<div className="mt-10">
			<h2 className="mb-4 font-serif text-2xl font-normal text-text">
				Recent Documents
			</h2>
			<ul className="flex flex-col gap-2.5">
				{documents.map((documentItem) => (
					<li key={documentItem.id}>
						<button
							className="flex w-full items-center justify-between rounded-xl border border-border bg-surface p-4 text-left transition-all hover:border-accent hover:shadow-sm cursor-pointer"
							onClick={handleSelect(documentItem.id)}
							type="button"
						>
							<div className="flex items-center gap-3">
								<svg
									className="h-4 w-4 text-text-muted"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<rect
										height="16"
										rx="1.5"
										strokeWidth="1.4"
										width="10"
										x="7"
										y="4"
									/>
								</svg>
								<span className="text-sm font-normal text-text">
									{documentItem.title}
								</span>
							</div>
							<span className="font-mono text-xs text-text-faint">
								{documentItem.updatedAt}
							</span>
						</button>
					</li>
				))}
			</ul>
		</div>
	);
};

export { RecentDocuments };
