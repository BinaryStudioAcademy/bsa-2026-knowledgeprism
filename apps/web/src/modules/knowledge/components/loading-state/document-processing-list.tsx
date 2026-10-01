import { type JSX } from "react";

import { useAppSelector } from "~/hooks/hooks.js";

import { ProcessingProgress } from "./libs/components/processing-progress.js";

const SINGLE_DOCUMENT_COUNT = 1;
const DocumentProcessingList = (): JSX.Element | null => {
	const { documentStatuses, trackedDocuments } = useAppSelector(
		(state) => state.knowledge,
	);
	if (trackedDocuments.length <= SINGLE_DOCUMENT_COUNT) {
		return null;
	}
	return (
		<ul
			aria-label="Document processing progress"
			className="flex w-full flex-col gap-3 border-b border-border p-4"
		>
			{trackedDocuments.map((document) => (
				<li
					className="rounded-md border border-border p-3"
					key={document.documentId}
				>
					<p className="mb-1 truncate font-medium">{document.label}</p>
					<ProcessingProgress
						currentStatus={document.status}
						progress={
							documentStatuses[document.documentId]?.processingProgress ?? null
						}
					/>
				</li>
			))}
		</ul>
	);
};
export { DocumentProcessingList };
